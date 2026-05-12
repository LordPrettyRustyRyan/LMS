from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from db import db

from core.utils import serialize_doc
from core.dependencies import get_current_user, require_role
from core.response import success_response
from core.errors import InvalidAssignmentID, ClassroomInvalidID

from schemas.assignments import AssignmentCreate, AssignmentUpdate
from services import assignment_service


router = APIRouter(prefix="/assignments", tags=["Assignments"])


# ----------- CREATE ASSIGNMENT ------------

@router.post("/")
async def create_assignment(
    payload: AssignmentCreate,
    current_user: dict = Depends(require_role("teacher"))
):
    teacher_id = current_user["_id"]

    assignment = await assignment_service.create_assignment(
        db,
        payload.model_dump(),
        teacher_id
    )

    return success_response(data=assignment)


# ----------- UPDATE ASSIGNMENT ------------

@router.put("/{assignment_id}")
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    current_user: dict = Depends(require_role("teacher"))
):
    if not ObjectId.is_valid(assignment_id):
        raise InvalidAssignmentID()

    teacher_id = current_user["_id"]

    updated = await assignment_service.update_assignment(
        db,
        assignment_id,
        payload.model_dump(exclude_unset=True),
        teacher_id
    )

    return success_response(data=updated)


# ----------- PUBLISH ASSIGNMENT ------------

@router.patch("/{assignment_id}/publish")
async def publish_assignment(
    assignment_id: str,
    current_user: dict = Depends(require_role("teacher"))
):
    if not ObjectId.is_valid(assignment_id):
        raise InvalidAssignmentID()

    teacher_id = current_user["_id"]

    assignment = await assignment_service.publish_assignment(
        db,
        assignment_id,
        teacher_id
    )

    return success_response(data=assignment)


# ----------- CLOSE ASSIGNMENT ------------

@router.patch("/{assignment_id}/close")
async def close_assignment(
    assignment_id: str,
    current_user: dict = Depends(require_role("teacher"))
):
    if not ObjectId.is_valid(assignment_id):
        raise InvalidAssignmentID()

    teacher_id = current_user["_id"]

    assignment = await assignment_service.close_assignment(
        db,
        assignment_id,
        teacher_id
    )

    return success_response(data=assignment)


# ----------- GET CLASSROOM ASSIGNMENTS ------------

@router.get("/classroom/{classroom_id}")
async def get_classroom_assignments(
    classroom_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(classroom_id):
        raise ClassroomInvalidID()

    assignments = await assignment_service.get_classroom_assignments(
        db,
        classroom_id,
        current_user
    )

    return success_response(data=assignments)


# ----------- GET SINGLE ASSIGNMENT ------------

@router.get("/{assignment_id}")
async def get_assignment(
    assignment_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(assignment_id):
        raise InvalidAssignmentID()

    assignment = await assignment_service.get_assignment(
        db,
        assignment_id,
        current_user
    )

    return success_response(data=assignment)


# ----------- GET ASSIGNMENT ATTEMPTS ------------

@router.get("/{assignment_id}/attempts")
async def get_assignment_attempts(
    assignment_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(assignment_id):
        raise InvalidAssignmentID()

    attempts = await assignment_service.get_assignment_attempts(
        db,
        assignment_id
    )

    return success_response(data=attempts)


# ----------- GET ASSIGNMENT RESPONSES ------------

@router.get("/attempts/{attempt_id}/responses")
async def get_attempt_responses(
    attempt_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(attempt_id):
        raise InvalidAssignmentID()

    responses = await assignment_service.get_attempt_responses(
        db,
        attempt_id
    )

    return success_response(data=responses)


# Get recent published assignments across student's classes

# @router.get("/students/feed")
# async def get_student_feed(
#     current_user: dict = Depends(require_role("student"))
# ):
#     """
#     Get recent published assignments across student's classes
#     """

#     student_id = current_user["_id"]

#     # 1. Find classes student is in
#     classes_cursor = db.classrooms.find({
#         "students": student_id
#     })

#     class_ids = []
#     async for c in classes_cursor:
#         class_ids.append(c["_id"])

#     # 2. Find published assignments from those classes
#     cursor = db.assignments.find({
#         "classroom_id": {"$in": class_ids},
#         "status": "published"
#     }).sort("created_at", -1).limit(3)

#     assignments = []

#     async for doc in cursor:
#         assignments.append(serialize_doc(doc))

#     return success_response(data=assignments)