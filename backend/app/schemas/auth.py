"""Authentication Pydantic schemas."""
from pydantic import BaseModel, EmailStr


class EmailPasswordRequest(BaseModel):
    """Payload for email and password login or signup requests."""

    email: EmailStr
    password: str
