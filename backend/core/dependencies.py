from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import jwt, JWTError
from bson import ObjectId
from db import db

from config import settings
from core.errors import Unauthorized, Forbidden, UserNotFound


security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    credentials_exception = Unauthorized()

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise UserNotFound()

    return user

def require_role(required_roles):
    async def role_checker(user=Depends(get_current_user)):
        # Ensure we are working with a list for easy comparison
        roles = [required_roles] if isinstance(required_roles, str) else required_roles

        if user["role"] == "admin":
            return user  # admin bypass

        if user["role"] not in roles:
            raise Forbidden(f"Required role: {roles}")

        return user
    return role_checker