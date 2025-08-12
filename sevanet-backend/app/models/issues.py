from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base

class IssueStatus(enum.Enum):
    pending = "pending"
    under_review = "under_review"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class SeverityLevel(enum.Enum):
    low = 1
    medium = 2
    high = 3
    critical = 4

class Issue(Base):
    __tablename__ = "issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)  # References existing users table
    category = Column(String(50), nullable=False)
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)
    status = Column(Enum(IssueStatus), default=IssueStatus.pending)
    severity_level = Column(Integer, default=1)
    assigned_authority_id = Column(UUID(as_uuid=True), ForeignKey("authorities.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    assigned_authority = relationship("Authority", back_populates="assigned_issues")