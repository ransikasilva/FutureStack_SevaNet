from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base

class Authority(Base):
    __tablename__ = "authorities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    category = Column(String(50), nullable=False)  # roads, electricity, water, safety, waste, etc.
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(100), nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    is_emergency_service = Column(Boolean, default=False)
    coverage_area = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    assigned_issues = relationship("Issue", back_populates="assigned_authority")