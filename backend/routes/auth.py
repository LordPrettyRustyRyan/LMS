from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional, Literal
from db import db

from core.security import hash_password, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from core.dependencies import get_current_user
from core.response import success_response
from core.errors import (
    EmailAlreadyExists,
    InvalidCredentials,
    InvalidRole,
    EmptyUpdateRequest,
    OldPasswordRequired,
    Forbidden
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ----------- SCHEMAS ------------

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str
    role: Literal["teacher", "student"] = "student" # Pydantic will auto-reject anything else

class UpdateUserRequest(BaseModel):
# Use Optional and default to None so the user doesn't have to send both
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    old_password: Optional[str] = Field(None, min_length=8)
    password: Optional[str] = Field(None, min_length=8)


# ----------- REGISTER ------------

@router.post("/register",  status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest):
    email = data.email.lower()

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise EmailAlreadyExists()

    # if data.role.lower() not in ["teacher", "student"]:
    #     raise InvalidRole()

    user = {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": data.role.lower(),
        "is_active": True,
        "is_paid": False,
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.users.insert_one(user)

    return success_response(
        message="User registered successfully"
    )


# ----------- LOG IN ------------

@router.post("/login", status_code=200)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):

    user = await db.users.find_one({"email": form_data.username.lower()})

    if not user:
        raise InvalidCredentials()

    try:
        is_valid = verify_password(form_data.password, user["password_hash"])
    except Exception:
        # hash corrupted / unexpected issue
        raise InvalidCredentials()

    if not is_valid:
        raise InvalidCredentials()
        
    if not user.get("is_active", True):
        raise Forbidden("Account disabled")

    token = create_access_token(
        data={
            "user_id": str(user["_id"]),
            "role": user["role"],
            "email": user["email"]
        }
    )

    return success_response(
        data={
            "access_token": token,
            "token_type": "bearer",
            "role": user["role"],
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 120  # Return in seconds
        }
    )


# ----------- GET ME ------------

@router.get("/me")
async def get_me(user = Depends(get_current_user)):
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "is_paid": user["is_paid"]
    }


# ----------- UPDATE DETAILS ------------

@router.put("/me")
async def update_me(data: UpdateUserRequest, user = Depends(get_current_user)):

    # 1. Get only the fields the user actually sent
    update_data = data.model_dump(exclude_unset=True)
    
    # 2. Remove sensitive fields from the dict so they don't go into the DB as-is
    new_password = update_data.pop("password", None)
    old_password = update_data.pop("old_password", None)

    # 3. Handle Password Logic
    db_user = await db.users.find_one({"_id": user["_id"]})

    if new_password:
        if not old_password:
            raise OldPasswordRequired()

        if not verify_password(old_password, db_user["password_hash"]):
            raise InvalidCredentials()

        # Add the hashed version to our update payload
        update_data["password_hash"] = hash_password(new_password)

    if not update_data:
        raise EmptyUpdateRequest()

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": update_data}
    )

    return success_response(
        message="Profile updated"
    )


# ----------- LOG OUT ------------

@router.post("/logout")
async def logout():
    return success_response(
        message="Logged out"
    )


# ----------- DELETE ACCOUNT ------------

@router.delete("/me")
async def delete_account(user = Depends(get_current_user)):

    if user["role"] == "admin":
        raise Forbidden("Admin account cannot be deleted")
    
    await db.users.delete_one({"_id": user["_id"]})

    return success_response(
        message="Account deleted"
    )

