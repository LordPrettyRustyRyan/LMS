from fastapi import APIRouter
from db import db

router = APIRouter()

@router.get("/collections")
async def test_db():
    collections = await db.list_collection_names()
    return {"collections": collections}

