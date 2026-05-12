from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Union, Any, Dict
from datetime import datetime, timezone
from .assignments import PyObjectId

# --- Answer Type Definitions ---

class MCQAnswer(BaseModel):
    option_id: str

class MatchConnection(BaseModel):
    left_id: str
    right_id: str

class MatchAnswer(BaseModel):
    connections: List[MatchConnection]

class SpeechAnswer(BaseModel):
    audio_url: str
    transcript: Optional[str] = None

class HandwritingAnswer(BaseModel):
    image_url: str
    recognized_text: Optional[str] = None

class CameraAnswer(BaseModel):
    image_url: str

class CalculationAnswer(BaseModel):
    value: str  # final number

class BlendingAnswer(BaseModel):
    audio_url: str

class RecognitionAnswer(BaseModel):
    option_id: str

AnyAnswer = Union[
    MCQAnswer,
    MatchAnswer,
    SpeechAnswer,
    HandwritingAnswer,
    CameraAnswer,
    CalculationAnswer,
    BlendingAnswer,
    RecognitionAnswer,
    Dict[str, Any]
]
# --- Main Response Schemas ---

class ResponseBase(BaseModel):
    attempt_id: PyObjectId
    question_id: PyObjectId
    sub_question_id: str

class ResponseCreate(ResponseBase):
    answer: AnyAnswer
    # Fixed: lambda for dynamic timestamp
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResponseUpdate(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None
    answer: Optional[AnyAnswer] = None 

class Response(ResponseBase):
    id: PyObjectId = Field(alias="_id")
    answer: AnyAnswer
    score: Optional[float] = None
    feedback: Optional[str] = None
    saved_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )