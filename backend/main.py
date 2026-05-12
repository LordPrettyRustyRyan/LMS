from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

from core.response import error_response
from core.errors import AppError
from config import settings
import core.cloudinary

from routes import dbcollections
from routes import phonics
from routes import auth
from routes import classrooms
from routes import assignments
from routes import attempts
from routes import responses
from routes import questions
from routes import media


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.include_router(dbcollections.router)
app.include_router(phonics.router)
app.include_router(auth.router)
app.include_router(classrooms.router)
app.include_router(questions.router)
app.include_router(assignments.router)
app.include_router(attempts.router)
app.include_router(responses.router)
app.include_router(media.router)

@app.get("/")
async def root():
    return {"message": "Phonics SaaS Backend Running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    
    formatted_errors = []

    for err in exc.errors():
        formatted_errors.append({
            "field": ".".join(str(x) for x in err["loc"]),
            "message": err["msg"]
        })
    
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request data",
                "details": formatted_errors
            }
        }
    )


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        },
        headers=exc.headers
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            code="HTTP_ERROR",
            message=exc.detail
        )
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):

    logger.exception(f"Unhandled error: {str(exc)}")

    return JSONResponse(
        status_code=500,
        content=error_response(
            code="INTERNAL_SERVER_ERROR",
            message="Something went wrong"
        )
    )