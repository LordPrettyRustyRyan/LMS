from fastapi import APIRouter, Query
from db import db
from bson import ObjectId

from core.response import success_response
from core.utils import serialize_doc

router = APIRouter(prefix="/questions", tags=["Questions"])


# ---------------------------------------------------
# QUESTION TYPE NORMALIZATION
# ---------------------------------------------------

QUESTION_TYPE_ALIASES = {
    "calculation": ["calculation", "calculations"],
    "mcq_3": ["mcq_3", "3_option_mcq"],
    "yes_no": ["yes_no", "yesno"],
    "match": ["match"],
    "text_reading": ["text_reading", "textreading"],
    "comprehension": ["comprehension"],
    "recognition": ["recognition", "number_recognition"],
    "blending": ["blending"],
    "camera": ["camera"],
    "picture": ["picture", "picture_speech"],
    "qnahandwriting": ["qnahandwriting", "QnA_handwriting"],
    "qnaspeech": ["qnaspeech", "QnA_speech"],
}


# ----------- GET QUESTIONS (FILTERED) ------------

@router.get("/")
async def get_questions(
    category: str = Query(None),
    qtype: str = Query(None)
):
    query = {}

    # CATEGORY FILTER

    if category:
        query["category"] = category

    # QUESTION TYPE FILTER

    if qtype:
        normalized_types = QUESTION_TYPE_ALIASES.get(
            qtype,
            [qtype]
        )

        query["type"] = {
            "$in": normalized_types
        }

    cursor = db.questions.find(query).sort("order", 1)

    questions = []

    async for doc in cursor:
        questions.append(serialize_doc(doc))

    return success_response(data=questions)


# ----------- GET SINGLE QUESTION ------------

@router.get("/{question_id}")
async def get_question(question_id: str):

    doc = await db.questions.find_one({
        "_id": ObjectId(question_id)
    })

    if not doc:
        return success_response(data=None)

    return success_response(
        data=serialize_doc(doc)
    )
