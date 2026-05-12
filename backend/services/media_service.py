import cloudinary.uploader


async def upload_media(
    file,
    folder: str,
    resource_type: str = "auto"
):
    result = cloudinary.uploader.upload(
        file=file,
        folder=folder,
        resource_type=resource_type
    )

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "resource_type": result["resource_type"]
    }