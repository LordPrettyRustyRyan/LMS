from fastapi import APIRouter, Depends, HTTPException
from services import attempt_service
from bson import ObjectId
from db import db

from core.dependencies import get_current_user, require_role
from core.errors import (
    InvalidAssignmentID,
    InvalidAttemptID
)
from core.response import success_response

router = APIRouter(prefix="/attempts", tags=["Attempts"])


# -----------------------------------------------------
# START OR RESUME ATTEMPT
# -----------------------------------------------------

@router.post("/assignments/{assignment_id}/attempt")
async def start_or_resume_attempt(
    assignment_id: str,
    current_user: dict = Depends(require_role("student"))
):
    """
    Student starts or resumes an assignment attempt.
    If attempt already exists → return existing attempt.
    """

    if not ObjectId.is_valid(assignment_id):
        raise InvalidAssignmentID()

    student_id = current_user["_id"]

    attempt = await attempt_service.start_or_resume_attempt(
        db,
        assignment_id,
        student_id
    )

    return success_response(data=attempt)

# -----------------------------------------------------
# GET ATTEMPT DETAILS
# -----------------------------------------------------

@router.get("/{attempt_id}")
async def get_attempt(
    attempt_id: str,
    current_user: dict = Depends(require_role(["student", "teacher"]))
):
    if not ObjectId.is_valid(attempt_id):
        raise InvalidAttemptID()

    attempt = await attempt_service.get_attempt(
        db,
        attempt_id,
        current_user
    )

    return success_response(data=attempt)


# -----------------------------------------------------
# SUBMIT ATTEMPT
# -----------------------------------------------------

@router.post("/{attempt_id}/submit")
async def submit_attempt(
    attempt_id: str,
    current_user: dict = Depends(require_role("student"))
):
    """
    Student submits assignment.
    After submission responses become locked.
    """

    if not ObjectId.is_valid(attempt_id):
        raise InvalidAttemptID()

    student_id = current_user["_id"]

    result = await attempt_service.submit_attempt(
        db,
        attempt_id,
        student_id
    )

    return success_response(data=result)


# -----------------------------------------------------
# GET STUDENT ATTEMPTS
# -----------------------------------------------------

@router.get("/students/me")
async def get_my_attempts(
    current_user: dict = Depends(require_role("student"))
):
    """
    Student dashboard:
    List all attempts for the logged-in student.
    """

    student_id = current_user["_id"]

    attempts = await attempt_service.get_student_attempts(
        db,
        student_id
    )

    return success_response(data=attempts)



@router.patch("/{attempt_id}/grade")
async def grade_attempt(
    attempt_id: str,
    current_user: dict = Depends(require_role("teacher"))
):
    if not ObjectId.is_valid(attempt_id):
        raise InvalidAttemptID()

    result = await attempt_service.grade_attempt(
        db,
        attempt_id,
        current_user["_id"]
    )

    return success_response(data=result)


# FULL ATTEMPT VIEW

@router.get("/{attempt_id}/full")
async def get_full_attempt(
    attempt_id: str,
    current_user: dict = Depends(require_role(["student", "teacher"]))
):
    if not ObjectId.is_valid(attempt_id):
        raise InvalidAttemptID()

    data = await attempt_service.get_full_attempt(
        db,
        attempt_id,
        current_user
    )

    return success_response(data=data)