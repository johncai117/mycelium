import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.models.protocol import Protocol
from app.services.docx_exporter import generate_docx

logger = logging.getLogger(__name__)
router = APIRouter()


class ExportRequest(BaseModel):
    protocol: Protocol


@router.post("/export/docx")
async def export_docx(request: ExportRequest):
    try:
        docx_bytes = generate_docx(request.protocol)
        filename = f"protocol_{request.protocol.study_id}_v{request.protocol.version}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail={"error": "export_failed", "detail": str(e), "field": None})
