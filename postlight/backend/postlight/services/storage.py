import uuid
from fastapi import UploadFile, HTTPException, status
from postlight.clients import supabase_admin
from postlight.config import settings

ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

async def upload_post_image(file: UploadFile, user_id: str) -> str:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: PNG, JPEG, WebP."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5 MB limit."
        )

    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    file_path = f"{user_id}/{uuid.uuid4()}.{ext}"

    try:
        supabase_admin.storage.from_(settings.storage_bucket).upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type}
        )
        return supabase_admin.storage.from_(settings.storage_bucket).get_public_url(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}"
        )

def delete_post_image(image_url: str):
    if not image_url:
        return
    try:
        target = f"{settings.storage_bucket}/"
        if target in image_url:
            path = image_url.split(target)[-1]
            supabase_admin.storage.from_(settings.storage_bucket).remove([path])
    except Exception:
        pass