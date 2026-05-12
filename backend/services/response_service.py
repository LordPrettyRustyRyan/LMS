from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from core.errors import (
    AttemptLocked,
    AttemptNotFound,
    InvalidAssignmentState,
    NotAssignmentOwner,
    ResponseNotFound,
    AssignmentClosed,
    NotAttemptOwner,
    AttemptAlreadySubmitted
)

ASSIGNMENTS = "assignments"
ATTEMPTS = "assignment_attempts"
RESPONSES = "assignment_responses"


# ------------------- Helper -------------------

def serialize_response(doc):
    if not doc:
        return None

    doc["_id"] = str(doc["_id"])
    doc["attempt_id"] = str(doc["attempt_id"])

    if doc.get("assignment_id"):
        doc["assignment_id"] = str(doc["assignment_id"])

    if doc.get("question_id"):
        doc["question_id"] = str(doc["question_id"])

    # 🔥 CRITICAL: clean nested ObjectIds inside answer
    def clean(obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, list):
            return [clean(i) for i in obj]
        if isinstance(obj, dict):
            return {k: clean(v) for k, v in obj.items()}
        return obj

    doc["answer"] = clean(doc.get("answer"))

    return doc

def ensure_attempt_active(attempt):
    if attempt["status"] in ["submitted", "graded"]:
        raise AttemptLocked()


# -----------------------------------------------------
# SAVE OR UPDATE RESPONSE (AUTOSAVE)
# -----------------------------------------------------

async def save_response(db, payload: dict, student_id: str):
    """
    Autosave response.

    If response exists -> update
    If not -> create

    Allows answer changes before submission.
    """

    attempt_id = payload["attempt_id"]

    attempt = await db[ATTEMPTS].find_one({
        "_id": ObjectId(attempt_id)
    })

    if not attempt:
        raise AttemptLocked()

    if attempt["student_id"] != ObjectId(student_id):
        raise NotAttemptOwner()

    if attempt["status"] == "submitted":
        raise AttemptAlreadySubmitted()
    
    ensure_attempt_active(attempt)

    # Check assignment state
    assignment = await db[ASSIGNMENTS].find_one({
        "_id": attempt["assignment_id"]
    })

    if assignment["status"] != "published":
        raise AssignmentClosed()

    question_id = payload["question_id"]
    sub_question_id = payload["sub_question_id"]

    response_filter = {
        "attempt_id": ObjectId(attempt_id),
        "question_id": ObjectId(question_id),
        "sub_question_id": sub_question_id
    }

    now = datetime.now(timezone.utc)

    update_doc = {
        "$set": {
            "answer": payload["answer"],
            "saved_at": now
        },
        "$setOnInsert": {
            "attempt_id": ObjectId(attempt_id),
            "question_id": ObjectId(question_id),
            "sub_question_id": sub_question_id
        }
    }

    await db[RESPONSES].update_one(
        response_filter,
        update_doc,
        upsert=True
    )

    response = await db[RESPONSES].find_one(response_filter)

    # Accurate progress (distinct sub-questions)
    answered_count = len(
        await db[RESPONSES].distinct(
            "sub_question_id",
            {"attempt_id": ObjectId(attempt_id)}
        )
    )

    await db[ATTEMPTS].update_one(
        {"_id": ObjectId(attempt_id)},
        {
            "$set": {
                "progress.answered_count": answered_count,
                "last_saved_at": now
            }
        }
    )

    return serialize_response(response)


# -----------------------------------------------------
# GET ATTEMPT RESPONSES (STUDENT VIEW)
# -----------------------------------------------------

async def get_student_responses(db, attempt_id: str, student_id: str):

    attempt = await db[ATTEMPTS].find_one({
        "_id": ObjectId(attempt_id)
    })

    if not attempt:
        raise AttemptNotFound()
    
    if attempt["student_id"] != ObjectId(student_id):
        raise NotAttemptOwner()

    cursor = db[RESPONSES].find({
        "attempt_id": ObjectId(attempt_id)
    })

    responses = []

    async for r in cursor:
        responses.append(serialize_response(r))

    return responses


# -----------------------------------------------------
# GET ATTEMPT RESPONSES (TEACHER VIEW)
# -----------------------------------------------------

async def get_teacher_responses(db, attempt_id: str, teacher_id: str):

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

    if attempt["status"] not in ["submitted", "graded"]:
        raise InvalidAssignmentState("Student has not submitted yet")

    cursor = db[RESPONSES].find({
        "attempt_id": ObjectId(attempt_id)
    })

    responses = []

    async for r in cursor:
        responses.append(serialize_response(r))

    return responses


# -----------------------------------------------------
# GRADE RESPONSE
# -----------------------------------------------------

async def grade_response(db, response_id: str, score: float, feedback: str | None, teacher_id: str):

    response = await db[RESPONSES].find_one({
        "_id": ObjectId(response_id)
    })

    if not response:
        raise ResponseNotFound()
    
    attempt = await db[ATTEMPTS].find_one({
        "_id": response["attempt_id"]
    })

    assignment = await db[ASSIGNMENTS].find_one({
        "_id": attempt["assignment_id"]
    })

    if assignment["teacher_id"] != ObjectId(teacher_id):
        raise NotAssignmentOwner()

    await db[RESPONSES].update_one(
        {"_id": ObjectId(response_id)},
        {
            "$set": {
                "score": score,
                "feedback": feedback
            }
        }
    )

    response["score"] = score
    response["feedback"] = feedback

    return serialize_response(response)