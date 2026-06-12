"""AI chat assistant routes."""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.chat_service import ChatService
from app.utils import get_current_user


router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)


class ChatResponse(BaseModel):
    message: str
    suggestions: List[str]
    snapshot: Optional[Dict] = None


@router.post("", response_model=ChatResponse)
def chat(
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reply to a user's finance question."""
    return ChatService.generate_reply(db, current_user.id, chat_request.message)
