from fastapi import APIRouter, HTTPException, Path
from db import db
from typing import List, Dict
from enum import Enum

router = APIRouter(prefix="/phonics", tags=["Phonics"])

class PhonicsLevel(str, Enum):
    basic = "basic"
    intermediate = "medium"
    advance = "advance"


# ----------- FETCH PHONICS - 3 LEVELS - 3 SLUGS ------------

@router.get("/")
async def get_phonics():
    pipeline = [
        {"$match": {"is_active": True}},
        {"$sort": {"order": 1}},
        {
            "$facet": {
                "basic": [
                    {"$match": {"level": "basic"}},
                    {"$limit": 3},
                    {"$project": {"_id": 0}}
                ],
                "medium": [
                    {"$match": {"level": "medium"}},
                    {"$limit": 3},
                    {"$project": {"_id": 0}}
                ],
                "advance": [
                    {"$match": {"level": "advance"}},
                    {"$limit": 3},
                    {"$project": {"_id": 0}}
                ]
            }
        }
    ]
    
    cursor = db.phonics.aggregate(pipeline)
    result = await cursor.to_list(length=1)
    return result[0] if result else {}


# ----------- ALL PHONICS BY LEVELS ------------

@router.get("/level/{level}")
async def get_phonics_by_level(level: PhonicsLevel):
    # Using PhonicsLevel Enum automatically validates the input and throws a 422 if invalid
    phonics = await db.phonics.find(
        {"level": level.value, "is_active": True},
        {"_id": 0}
    ).sort("order", 1).to_list(length=100)

    if not phonics:
        return [] # Return empty list instead of 404 for valid but empty levels

    return phonics


# ----------- SINGLE SLUG ------------

@router.get("/{slug}")
async def get_single_phonics(
    slug: str = Path(..., min_length=3, max_length=50)
):

    phonics = await db.phonics.find_one(
        {"slug": slug, "is_active": True},
        {"_id": 0}
    )

    if not phonics:
        raise HTTPException(404, "Phonics lesson not found")

    return phonics