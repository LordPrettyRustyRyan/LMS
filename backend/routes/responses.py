from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from db import db

from core.response import success_response
from core.dependencies import get_current_user, require_role
from core.errors import (
    NotAttemptOwner,
    NotResponseOwner
)

from schemas.assignment_responses import ResponseCreate, ResponseUpdate
from services import response_service


router = APIRouter(prefix="/responses", tags=["Responses"])


# -----------------------------------------------------
# AUTOSAVE RESPONSE (STUDENT)
# -----------------------------------------------------

@router.post("/")
async def save_response(
    payload: ResponseCreate,
    current_user: dict = Depends(require_role("student"))
):
    """
    Autosave student answer.

    - creates response if first answer
    - updates response if student changes answer
    """

    student_id = current_user["_id"]

    response = await response_service.save_response(
        db,
        payload.model_dump(),
        student_id
    )

    return success_response(data=response)


# -----------------------------------------------------
# GET RESPONSES FOR ATTEMPT (STUDENT RESUME)
# -----------------------------------------------------

@router.get("/attempts/{attempt_id}")
async def get_student_responses(
    attempt_id: str,
    current_user: dict = Depends(require_role("student"))
):
    """
    Student loads saved responses when resuming assignment
    """

    if not ObjectId.is_valid(attempt_id):
        raise NotAttemptOwner()

    student_id = current_user["_id"]

    responses = await response_service.get_student_responses(
        db,
        attempt_id,
        student_id
    )

    return success_response(data=responses)


# -----------------------------------------------------
# GET RESPONSES FOR ATTEMPT (TEACHER VIEW)
# -----------------------------------------------------

@router.get("/attempts/{attempt_id}/teacher")
async def get_teacher_responses(
    attempt_id: str,
    current_user: dict = Depends(require_role("teacher"))
):
    """
    Teacher views student responses after submission
    """

    if not ObjectId.is_valid(attempt_id):
        raise NotAttemptOwner()

    responses = await response_service.get_teacher_responses(
        db,
        attempt_id,
        current_user["_id"]
    )

    return success_response(data=responses)


# -----------------------------------------------------
# GRADE RESPONSE (TEACHER)
# -----------------------------------------------------

@router.patch("/{response_id}/grade")
async def grade_response(
    response_id: str,
    payload: ResponseUpdate,
    current_user: dict = Depends(require_role("teacher"))
):
    """
    Teacher grades individual response
    """

    if not ObjectId.is_valid(response_id):
        raise NotResponseOwner()

    response = await response_service.grade_response(
        db,
        response_id,
        payload.score,
        payload.feedback,
        current_user["_id"]
    )

    return success_response(data=response)
