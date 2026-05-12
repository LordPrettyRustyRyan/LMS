from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from .assignments import PyObjectId 

class AttemptStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"

class AttemptProgress(BaseModel):
    answered_count: int = 0
    total_questions: int

class AttemptBase(BaseModel):
    assignment_id: PyObjectId
    student_id: PyObjectId
    status: AttemptStatus = AttemptStatus.NOT_STARTED
    max_score: int

class AttemptCreate(BaseModel):
    assignment_id: PyObjectId
    student_id: PyObjectId

class AttemptUpdate(BaseModel):
    status: Optional[AttemptStatus] = None
    progress: Optional[AttemptProgress] = None
    # Fixed: uses lambda for dynamic timestamp
    last_saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Attempt(AttemptBase):
    id: PyObjectId = Field(alias="_id")
    # Fixed: all factories updated to lambdas
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None
    
    progress: AttemptProgress
    score: Optional[float] = None 

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )