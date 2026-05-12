from fastapi import APIRouter, UploadFile, File, Form

from services.media_service import upload_media

router = APIRouter(
    prefix="/media",
    tags=["Media"]
)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form(...)
):
    result = await upload_media(
        file=file.file,
        folder=folder
    )

    return {
        "success": True,
        "data": result
    }