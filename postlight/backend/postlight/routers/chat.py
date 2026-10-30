from fastapi import APIRouter, Depends, HTTPException
from postlight.dependencies import get_current_user_id
from postlight.database import get_db
from postlight.schemas import ChatRequest, ChatResponse
from postlight.services.retrieval import answer_financial_question

router = APIRouter(prefix="/chat", tags=["Financial AI Assistant"])

@router.post("", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest, user_id: str = Depends(get_current_user_id)):
    try:
        with get_db() as conn:
            return answer_financial_question(conn, user_id, payload.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Advisor error: {str(e)}")