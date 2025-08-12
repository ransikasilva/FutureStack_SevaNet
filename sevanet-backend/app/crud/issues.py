from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.issues import Issue
from app.models.authorities import Authority
from app.schemas.issues import IssueCreate, IssueUpdate

class IssueCRUD:
    def create_issue(self, db: Session, issue: IssueCreate, image_url: Optional[str] = None) -> Issue:
        db_issue = Issue(
            user_id=issue.user_id,
            category=issue.category,
            title=issue.title,
            description=issue.description,
            location=issue.location,
            severity_level=issue.severity_level,
            image_url=image_url
        )
        db.add(db_issue)
        db.commit()
        db.refresh(db_issue)
        return db_issue

    def get_issue(self, db: Session, issue_id: UUID) -> Optional[Issue]:
        return db.query(Issue).filter(Issue.id == issue_id).first()

    def get_issues_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Issue]:
        return db.query(Issue).filter(Issue.user_id == user_id).offset(skip).limit(limit).all()

    def get_all_issues(self, db: Session, skip: int = 0, limit: int = 100) -> List[Issue]:
        return db.query(Issue).offset(skip).limit(limit).all()

    def update_issue(self, db: Session, issue_id: UUID, issue_update: IssueUpdate) -> Optional[Issue]:
        db_issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if db_issue:
            update_data = issue_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_issue, field, value)
            db.commit()
            db.refresh(db_issue)
        return db_issue

    def delete_issue(self, db: Session, issue_id: UUID) -> bool:
        db_issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if db_issue:
            db.delete(db_issue)
            db.commit()
            return True
        return False

class AuthorityCRUD:
    def get_authority(self, db: Session, authority_id: UUID) -> Optional[Authority]:
        return db.query(Authority).filter(Authority.id == authority_id).first()

    def get_authorities(self, db: Session, skip: int = 0, limit: int = 100) -> List[Authority]:
        return db.query(Authority).offset(skip).limit(limit).all()

    def get_authorities_by_category(self, db: Session, category: str) -> List[Authority]:
        return db.query(Authority).filter(Authority.category == category).all()

# Create instances
issue_crud = IssueCRUD()
authority_crud = AuthorityCRUD()