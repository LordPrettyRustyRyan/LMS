from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from services.attempt_service import serialize_attempt
from core.errors import (
    AssignmentNotFound,
    NotAssignmentOwner,
    InvalidAssignmentState,
    ClassroomNotFound,
    NotClassroomOwner
)


# ----------- Collections Used ------------

ASSIGNMENTS = "assignments"
ATTEMPTS = "assignment_attempts"
RESPONSES = "assignment_responses"
CLASSROOMS = "classrooms"


# ----------- Helpers ------------

def calculate_total_marks(questions: list) -> int:
    # Calculate total assignment marks. marks_per_sub * number_of_sub_questions
    total = 0

    for q in questions:
        sub_count = len(q["sub_questions"])
        marks = q["marks_per_sub"]
        total += sub_count * marks

    return total

def serialize(doc):
    # Convert ObjectId to string for API output
    if not doc:
        return None

    doc["_id"] = str(doc["_id"])

    if "teacher_id" in doc:
        doc["teacher_id"] = str(doc["teacher_id"])

    if "classroom_id" in doc:
        doc["classroom_id"] = str(doc["classroom_id"])

    return doc

def normalize_type(qtype: str):
    if not qtype:
        return None

    qtype = qtype.lower().replace("&", "").replace(" ", "").replace("_", "")

    mapping = {
        "3optionmcq": "mcq_3",
        "mcq3": "mcq_3",
        "yesno": "yes_no",
        "qahwr": "qna_handwriting",
        "handwriting": "qna_handwriting",
        "qaspeech": "qna_speech",
        "speech": "qna_speech",
        "match": "match",
        "textreading": "text_reading",
        "calculations": "calculation",
        "recognition": "recognition",
        "blending": "blending",
        "comprehension": "comprehension",
        "camera": "camera",
        "picturespeech": "picture_speech"
    }

    return mapping.get(qtype, qtype)


# ----------- VALIDATION HELPERS ------------

async def validate_classroom_ownership(db, classroom_id, teacher_id):
    classroom = await db[CLASSROOMS].find_one({
        "_id": ObjectId(classroom_id)
    })

    if not classroom:
        raise ClassroomNotFound()

    if classroom["teacher_id"] != ObjectId(teacher_id):
        raise NotClassroomOwner()

    return classroom


async def validate_assignment_owner(db, assignment_id, teacher_id):
    assignment = await db[ASSIGNMENTS].find_one({
        "_id": ObjectId(assignment_id)
    })

    if not assignment:
        raise AssignmentNotFound()

    if assignment["teacher_id"] != ObjectId(teacher_id):
        raise NotAssignmentOwner()

    return assignment


# ----------- CREATE ASSIGNMENT ------------

async def create_assignment(db, assignment_data: dict, teacher_id: str):
    await validate_classroom_ownership(
        db,
        assignment_data["classroom_id"],
        teacher_id
    )

    assignment = {
        "title": assignment_data["title"],
        "teacher_id": ObjectId(teacher_id),
        "classroom_id": ObjectId(assignment_data["classroom_id"]),
        "status": "draft",
        "due_date": assignment_data["due_date"],
        "created_at": datetime.now(timezone.utc),
        "questions": assignment_data["questions"],
        "total_marks": calculate_total_marks(assignment_data["questions"])
    }

    result = await db[ASSIGNMENTS].insert_one(assignment)
    assignment["_id"] = result.inserted_id

    return serialize(assignment)


# ----------- UPDATE ASSIGNMENT ------------

async def update_assignment(db, assignment_id: str, update_data: dict, teacher_id: str):
    
    assignment = await validate_assignment_owner(
        db,
        assignment_id,
        teacher_id
    )

    if assignment["status"] != "draft":
        raise InvalidAssignmentState("Only draft assignments can be edited. Cannot edit published assignment")

    update_fields = {}

    if "title" in update_data:
        update_fields["title"] = update_data["title"]

    if "due_date" in update_data:
        update_fields["due_date"] = update_data["due_date"]

    if "questions" in update_data:
        update_fields["questions"] = update_data["questions"]
        update_fields["total_marks"] = calculate_total_marks(update_data["questions"])

    await db[ASSIGNMENTS].update_one(
        {"_id": ObjectId(assignment_id)},
        {"$set": update_fields}
    )

    updated = await db[ASSIGNMENTS].find_one({"_id": ObjectId(assignment_id)})

    return serialize(updated)


# ----------- PUBLISH ASSIGNMENT ------------

async def publish_assignment(db, assignment_id: str, teacher_id: str):
    
    assignment = await validate_assignment_owner(
        db,
        assignment_id,
        teacher_id
    )

    if assignment["status"] != "draft":
        raise InvalidAssignmentState("Assignment already published")

    await db[ASSIGNMENTS].update_one(
        {"_id": ObjectId(assignment_id)},
        {"$set": {"status": "published"}}
    )

    assignment["status"] = "published"

    return serialize(assignment)


# ----------- CLOSE ASSIGNMENT ------------

async def close_assignment(db, assignment_id: str, teacher_id: str):
    
    assignment = await validate_assignment_owner(
        db,
        assignment_id,
        teacher_id
    )

    if assignment["status"] != "published":
        raise InvalidAssignmentState("Only published assignments can be closed")

    # if assignment["status"] == "closed":
    #     raise InvalidAssignmentState("Assignment already closed")

    await db[ASSIGNMENTS].update_one(
        {"_id": ObjectId(assignment_id)},
        {"$set": {"status": "closed"}}
    )

    assignment["status"] = "closed"

    return serialize(assignment)


# ----------- GET SINGLE ASSIGNMENT ------------

async def get_assignment(db, assignment_id: str, user):

    assignment = await db[ASSIGNMENTS].find_one({
        "_id": ObjectId(assignment_id)
    })

    if not assignment:
        raise AssignmentNotFound()
    
    if user["role"] == "student" and assignment["status"] == "draft":
        raise AssignmentNotFound()

    hydrated_questions = []

    for q in assignment["questions"]:
        question_doc = await db["questions"].find_one({
            "_id": ObjectId(q["question_id"])
        })

        if not question_doc:
            continue  # skip broken reference safely

        # FILTER only selected sub_questions
        selected_subs = [
            sq for sq in question_doc.get("sub_questions", [])
            if sq["id"] in q["sub_questions"]
        ]

        hydrated_questions.append({
            "question_id": str(question_doc["_id"]),
            # "type": str(question_doc.get("type", "unknown")).strip().lower(),
            "type": normalize_type(question_doc.get("type")),
            "question_title": question_doc.get("question_title"),
            "instruction": question_doc.get("instruction"),
            "comprehension": question_doc.get("comprehension", []),
            "sub_questions": selected_subs,
            "marks_per_sub": q["marks_per_sub"]
        })

    assignment["questions"] = hydrated_questions

    return serialize(assignment)


# ----------- GET CLASSROOM ASSIGNMENTS ------------

async def get_classroom_assignments(db, classroom_id: str, user):

    base_query = {
        "classroom_id": ObjectId(classroom_id)
    }

    if user["role"] == "student":
        base_query["status"] = {"$in": ["published", "closed"]}

    cursor = db[ASSIGNMENTS].find(base_query).sort("created_at", -1)

    assignments = []

    async for doc in cursor:
        assignments.append(serialize(doc))

    return assignments


# ----------- GET ASSIGNMENT ATTEMPTS ------------

async def get_assignment_attempts(db, assignment_id: str):
    """
    Teacher view: list all student attempts.
    """

    cursor = db[ATTEMPTS].find(
        {"assignment_id": ObjectId(assignment_id)}
    )

    attempts = []

    async for attempt in cursor:
        attempt["_id"] = str(attempt["_id"])
        attempt["assignment_id"] = str(attempt["assignment_id"])
        attempt["student_id"] = str(attempt["student_id"])
        attempts.append(serialize_attempt(attempt))

    return attempts


# ----------- GET ASSIGNMENT RESPONSES ------------

async def get_attempt_responses(db, attempt_id: str):
    """
    Teacher view student answers.
    Only allowed after submission.
    """

    attempt = await db[ATTEMPTS].find_one({"_id": ObjectId(attempt_id)})

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if attempt["status"] not in ["submitted", "graded"]:
        raise HTTPException(
            status_code=400,
            detail="Student has not submitted assignment yet"
        )

    cursor = db[RESPONSES].find(
        {"attempt_id": ObjectId(attempt_id)}
    )

    responses = []

    async for r in cursor:
        r["_id"] = str(r["_id"])
        r["attempt_id"] = str(r["attempt_id"])
        r["question_id"] = str(r["question_id"])
        responses.append(r)

    return responses