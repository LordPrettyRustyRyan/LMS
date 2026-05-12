from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from services.response_service import RESPONSES
from core.errors import (
    AttemptNotFound,
    NotAttemptOwner,
    AttemptAlreadySubmitted,
    AttemptLocked,
    AssignmentNotAvailable,
    AssignmentNotFound,
    NotAssignmentOwner
)

ASSIGNMENTS = "assignments"
ATTEMPTS = "assignment_attempts"


# -----------------------------------------------------
# Helper
# -----------------------------------------------------

def serialize_attempt(doc):
    if not doc:
        return None

    doc["_id"] = str(doc["_id"])
    doc["assignment_id"] = str(doc["assignment_id"])
    doc["student_id"] = str(doc["student_id"])

    if doc.get("classroom_id"):
        doc["classroom_id"] = str(doc["classroom_id"])

    return doc


# ------------------ START OR RESUME ATTEMPT ------------------------

async def start_or_resume_attempt(db, assignment_id: str, student_id: str):

    assignment = await db[ASSIGNMENTS].find_one(
        {"_id": ObjectId(assignment_id)}
    )

    if not assignment:
        raise AssignmentNotFound()

    if assignment["status"] != "published":
        raise AssignmentNotAvailable()
    
    # ATOMIC UPSERT (FIXES RACE CONDITION)
    attempt = await db[ATTEMPTS].find_one_and_update(
        {
            "assignment_id": ObjectId(assignment_id),
            "student_id": ObjectId(student_id)
        },
        {
            "$setOnInsert": {
                "assignment_id": ObjectId(assignment_id),
                "student_id": ObjectId(student_id),
                "classroom_id": assignment["classroom_id"],
                "status": "in_progress",
                "started_at": datetime.now(timezone.utc),
                "last_saved_at": datetime.now(timezone.utc),
                "submitted_at": None,
                "graded_at": None,
                "progress": {
                    "answered_count": 0,
                    "total_questions": sum(
                        len(q["sub_questions"]) for q in assignment["questions"]
                    )
                },
                "score": None,
                "max_score": assignment["total_marks"]
            }
        },
        upsert=True,
        return_document=True
    )

    return serialize_attempt(attempt)


# ------------------ LOCK HELPER -----------------

def ensure_attempt_active(attempt):
    if attempt["status"] in ["submitted", "graded"]:
        raise AttemptLocked()
    

# ------------------- GET ATTEMPT --------------------

async def get_attempt(db, attempt_id: str, user: dict):

    attempt = await db[ATTEMPTS].find_one(
        {"_id": ObjectId(attempt_id)}
    )

    if not attempt:
        raise AttemptNotFound()

    # ---------------- STUDENT ----------------
    if user["role"] == "student":
        if attempt["student_id"] != ObjectId(user["_id"]):
            raise NotAttemptOwner()

    # ---------------- TEACHER ----------------
    elif user["role"] == "teacher":

        assignment = await db[ASSIGNMENTS].find_one({
            "_id": attempt["assignment_id"]
        })

        if not assignment:
            raise AssignmentNotFound()

        if assignment["teacher_id"] != ObjectId(user["_id"]):
            raise NotAssignmentOwner()

    return serialize_attempt(attempt)


# ------------------ SUBMIT ATTEMPT ---------------------

async def submit_attempt(db, attempt_id: str, student_id: str):

    attempt = await db[ATTEMPTS].find_one(
        {"_id": ObjectId(attempt_id)}
    )

    if not attempt:
        raise AttemptNotFound()

    if attempt["student_id"] != ObjectId(student_id):
        raise NotAttemptOwner()

    # Idempotent behavior
    if attempt["status"] == "submitted":
        # raise HTTPException(400, "Assignment already submitted")
        return serialize_attempt(attempt)

    # Check assignment state
    assignment = await db[ASSIGNMENTS].find_one({
        "_id": attempt["assignment_id"]
    })

    if assignment["status"] != "published":
        raise AssignmentNotAvailable()

    now = datetime.now(timezone.utc)

    await db[ATTEMPTS].update_one(
        {"_id": ObjectId(attempt_id)},
        {
            "$set": {
                "status": "submitted",
                "submitted_at": now,
                "last_saved_at": now
            }
        }
    )

    attempt["status"] = "submitted"
    attempt["submitted_at"] = now

    return serialize_attempt(attempt)


# ---------------- UPDATE ATTEMPT PROGRESS (called by autosave) -------------------

async def update_attempt_progress(db, attempt_id: str, answered_count: int):

    attempt = await db[ATTEMPTS].find_one({
        "_id": ObjectId(attempt_id)
    })

    if not attempt:
        raise AttemptNotFound()

    ensure_attempt_active(attempt)

    await db[ATTEMPTS].update_one(
        {"_id": ObjectId(attempt_id)},
        {
            "$set": {
                "progress.answered_count": answered_count,
                "last_saved_at": datetime.now(timezone.utc)
            }
        }
    )


# ------------------- GET STUDENT ATTEMPTS ----------------------

async def get_student_attempts(db, student_id: str):

    cursor = db[ATTEMPTS].find(
        {"student_id": ObjectId(student_id)}
    ).sort("started_at", -1)

    attempts = []

    async for doc in cursor:
        attempts.append(serialize_attempt(doc))

    return attempts

# Grade

async def grade_attempt(db, attempt_id: str, teacher_id: str):

    attempt = await db[ATTEMPTS].find_one({
        "_id": ObjectId(attempt_id)
    })

    if not attempt:
        raise AttemptNotFound()

    assignment = await db[ASSIGNMENTS].find_one({
        "_id": attempt["assignment_id"]
    })

    if assignment["teacher_id"] != ObjectId(teacher_id):
        raise NotAssignmentOwner()

    # calculate total score
    responses = db["assignment_responses"].find({
        "attempt_id": ObjectId(attempt_id)
    })

    total_score = 0

    async for r in responses:
        total_score += r.get("score", 0)

    now = datetime.now(timezone.utc)

    await db[ATTEMPTS].update_one(
        {"_id": ObjectId(attempt_id)},
        {
            "$set": {
                "status": "graded",
                "graded_at": now,
                "score": total_score
            }
        }
    )

    attempt["status"] = "graded"
    attempt["graded_at"] = now
    attempt["score"] = total_score

    return serialize_attempt(attempt)


# FULL ATTEMPT VIEW

async def get_full_attempt(db, attempt_id: str, user: dict):

    attempt = await db[ATTEMPTS].find_one({
        "_id": ObjectId(attempt_id)
    })

    if not attempt:
        raise AttemptNotFound()

    # ---- ACCESS CONTROL ----
    if user["role"] == "student":
        if attempt["student_id"] != ObjectId(user["_id"]):
            raise NotAttemptOwner()

    elif user["role"] == "teacher":
        assignment = await db[ASSIGNMENTS].find_one({
            "_id": attempt["assignment_id"]
        })

        if assignment["teacher_id"] != ObjectId(user["_id"]):
            raise NotAssignmentOwner()

    # ---- GET ASSIGNMENT ----
    assignment = await db[ASSIGNMENTS].find_one({
        "_id": attempt["assignment_id"]
    })

    # reuse your existing hydration logic
    from services.assignment_service import get_assignment
    hydrated_assignment = await get_assignment(
        db,
        str(assignment["_id"]),
        user
    )

    # ---- GET RESPONSES ----
    cursor = db[RESPONSES].find({
        "attempt_id": ObjectId(attempt_id)
    })

    response_map = {}

    async for r in cursor:
        response_map[r["sub_question_id"]] = {
            "answer": r.get("answer"),
            "score": r.get("score"),
            "feedback": r.get("feedback")
        }

    return {
        "attempt": serialize_attempt(attempt),
        "assignment": hydrated_assignment,
        "responses": response_map
    }