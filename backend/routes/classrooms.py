from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from pymongo import ReturnDocument
import random
import string

from core.response import success_response
from core.errors import AppError, Forbidden
from core.utils import serialize_doc
from db import db
from core.dependencies import require_role

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])

class CreateClassroomRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)

class UpdateClassroomRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)

async def generate_invite_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        existing = await db.classrooms.find_one({"invite_code": code})
        if not existing:
            return code
        

# ----------- CREATE CLASSROOM - TEACHER ------------

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_classroom(
    data: CreateClassroomRequest,
    user=Depends(require_role("teacher"))
):
    invite_code = await generate_invite_code()

    classroom = {
        "name": data.name,
        "teacher_id": user["_id"],
        "invite_code": invite_code,
        "students": [],
        "created_at": datetime.now(timezone.utc)
    }

    await db.classrooms.insert_one(classroom)

    return success_response(
        data={"invite_code": invite_code},
        message="Classroom created"
    )


# ----------- JOIN CLASSROOM - STUDENT ------------

@router.post("/join")
async def join_classroom(
    invite_code: str,
    user=Depends(require_role("student"))
):
    # Atomic check: Find class AND ensure student isn't already in it
    result = await db.classrooms.find_one_and_update(
        {
            "invite_code": invite_code, 
            "students": {"$ne": user["_id"]}
        },
        {"$addToSet": {"students": user["_id"]}},
        return_document=ReturnDocument.AFTER
    )

    if not result:
        # Check if it's a 404 (wrong code) or 400 (already joined)
        class_exists = await db.classrooms.find_one({"invite_code": invite_code})
        if not class_exists:
            raise AppError("INVALID_INVITE_CODE", "Invalid invite code", 404)
        raise AppError("ALREADY_JOINED", "You have already joined this classroom", 400)

    # return {"message": "Joined successfully", "classroom": serialize_doc(result)}
    return success_response(
        data=serialize_doc(result),
        message="Joined successfully"
    )


# ----------- LEAVE CLASSROOM - STUDENT ------------

@router.post("/leave/{classroom_id}")
async def leave_classroom(
    classroom_id: str,
    user=Depends(require_role("student"))
):

    result = await db.classrooms.update_one(
        {"_id": ObjectId(classroom_id), "students": user["_id"]},
        {"$pull": {"students": user["_id"]}}
    )

    if result.modified_count == 0:
        raise AppError("NOT_ENROLLED", "Not enrolled in classroom", 404)

    return success_response(message="Left classroom")


# ----------- GET ALL CLASSROOMS  - STUDENT & TEACHER ------------

@router.get("/my-classes")
async def get_user_classrooms(user=Depends(require_role(["teacher", "student"]))):
    """
    Combined endpoint: Returns classrooms where user is either the teacher or a student.
    """
    if user["role"] == "teacher":
        query = {"teacher_id": user["_id"]}
    else:
        query = {"students": user["_id"]}
        
    classrooms = await db.classrooms.find(query).to_list(length=100)

    return success_response(
        data=[serialize_doc(c) for c in classrooms]
    )

# ----------- GET SPECIFIC CLASSROOM  - STUDENT & TEACHER ------------

@router.get("/{classroom_id}")
async def get_classroom(
    classroom_id: str, 
    user=Depends(require_role(["teacher", "student"]))
):
    # Only allow the teacher of the class OR a student enrolled in it to see details
    query = {
        "_id": ObjectId(classroom_id),
        "$or": [
            {"teacher_id": user["_id"]},
            {"students": user["_id"]}
        ]
    }
    
    classroom = await db.classrooms.find_one(query)

    if not classroom:
        raise AppError("CLASSROOM_NOT_FOUND", "Classroom not found or access denied", 404)

    return success_response(data=serialize_doc(classroom))


# ----------- RENAME CLASSROOM - TEACHER ------------

@router.put("/{classroom_id}")
async def rename_classroom(
    classroom_id: str,
    data: UpdateClassroomRequest,
    user=Depends(require_role("teacher"))
):

    result = await db.classrooms.update_one(
        {"_id": ObjectId(classroom_id), "teacher_id": user["_id"]},
        {"$set": {"name": data.name}}
    )

    if result.matched_count == 0:
        raise AppError("CLASSROOM_NOT_FOUND", "Classroom not found", 404)

    return success_response(message="Classroom updated")


# ----------- DELETE CLASSROOM - TEACHER ------------

@router.delete("/{classroom_id}")
async def delete_classroom(
    classroom_id: str,
    user=Depends(require_role("teacher"))
):

    result = await db.classrooms.delete_one(
        {"_id": ObjectId(classroom_id), "teacher_id": user["_id"]}
    )

    if result.deleted_count == 0:
        raise AppError("CLASSROOM_NOT_FOUND", "Classroom not found", 404)

    return success_response(message="Classroom deleted")


# ----------- REMOVE STUDENT - TEACHER ------------

@router.delete("/{classroom_id}/students/{student_id}")
async def remove_student(
    classroom_id: str,
    student_id: str,
    user=Depends(require_role("teacher"))
):

    # Ensure the teacher owns the classroom before pulling the student
    result = await db.classrooms.update_one(
        {"_id": ObjectId(classroom_id), "teacher_id": user["_id"]},
        {"$pull": {"students": ObjectId(student_id)}}
    )

    if str(user["_id"]) == student_id:
        raise Forbidden("Teacher cannot remove themselves")

    if result.matched_count == 0:
        raise AppError("CLASSROOM_NOT_FOUND", "Classroom not found or unauthorized", 404)

    return success_response(message="Student removed")
