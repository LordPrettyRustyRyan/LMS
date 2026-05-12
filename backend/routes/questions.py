from fastapi import APIRouter, Query
from db import db
from bson import ObjectId

from core.response import success_response
from core.utils import serialize_doc

router = APIRouter(prefix="/questions", tags=["Questions"])


# ----------- GET QUESTIONS (FILTERED) ------------

@router.get("/")
async def get_questions(
    category: str = Query(None),
    qtype: str = Query(None)
):
    query = {}

    if category:
        query["category"] = category

    if qtype:
        query["type"] = qtype

    cursor = db.questions.find(query).sort("order", 1)

    questions = []

    async for doc in cursor:
        questions.append(serialize_doc(doc))

    return success_response(data=questions)


# ----------- GET SINGLE QUESTION ------------

@router.get("/{question_id}")
async def get_question(question_id: str):
    doc = await db.questions.find_one({"_id": ObjectId(question_id)})

    if not doc:
        return success_response(data=None)

    return success_response(data=serialize_doc(doc))