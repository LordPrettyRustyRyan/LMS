from pydantic import BaseModel, Field, ConfigDict, GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import List, Optional, Any
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId

# --- Pydantic v2 Compliant ObjectId Handler ---

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ]),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v: str) -> str:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return v

# --- Enums and Sub-Schemas ---

class AssignmentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"

class QuestionSchema(BaseModel):
    # Using Field(default_factory=...) or Alias ensures compatibility with Mongo
    question_id: PyObjectId = Field(...)
    sub_questions: List[str]
    marks_per_sub: int

# --- Main Assignment Schemas ---

class AssignmentBase(BaseModel):
    title: str
    classroom_id: PyObjectId
    status: AssignmentStatus = AssignmentStatus.DRAFT
    due_date: datetime
    questions: List[QuestionSchema]

class AssignmentCreate(AssignmentBase):
    """Schema for creating a new assignment"""
    pass

class AssignmentUpdate(BaseModel):
    """Schema for updating - all fields optional"""
    title: Optional[str] = None
    status: Optional[AssignmentStatus] = None
    due_date: Optional[datetime] = None
    questions: Optional[List[QuestionSchema]] = None

class Assignment(AssignmentBase):
    """The full schema including database-generated fields"""
    # Use Field(alias="_id") to map MongoDB's ID to 'id' in Python
    id: PyObjectId = Field(alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_marks: int

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )