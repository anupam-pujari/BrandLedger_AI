"""
Collaboration & Human Reviews API Router (T-103, T-104, T-105, T-106).
"""

from typing import Optional, Literal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status

from app.dependencies import get_current_user, require_role
from app.middleware.auth import CurrentUser
from app.db.client import get_supabase_admin
from app.db.repositories.content_repo import ContentRepository
from app.db.repositories.review_repo import ReviewRepository
from app.db.repositories.notification_repo import NotificationRepository

router = APIRouter(prefix="/content", tags=["Collaboration & Reviews"])


class ReviewCreateRequest(BaseModel):
    decision: Literal["approved", "changes_requested"]
    notes: Optional[str] = None


class CommentCreateRequest(BaseModel):
    body: str
    finding_id: Optional[str] = None


@router.get("/{content_id}/reviews")
async def list_reviews(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    reviews = await ReviewRepository.list_reviews(admin_client, current_user.org_id, content_id)
    return {
        "success": True,
        "data": {"reviews": reviews},
        "error": None,
        "meta": {"total": len(reviews)}
    }


@router.post("/{content_id}/reviews", status_code=status.HTTP_201_CREATED)
async def submit_review(
    content_id: str,
    payload: ReviewCreateRequest,
    current_user: CurrentUser = Depends(require_role("reviewer", "brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    content_item = await ContentRepository.get_by_id(admin_client, current_user.org_id, content_id)

    # 1. Record Review Decision
    review = await ReviewRepository.add_review(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id,
        reviewer_id=current_user.id,
        decision=payload.decision,
        notes=payload.notes
    )

    # 2. State machine transition: in_review -> approved or changes_requested
    new_status = payload.decision
    await ContentRepository.transition_status(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id,
        target_status=new_status,
        actor_id=current_user.id,
        actor_role=current_user.role
    )

    # 3. Trigger Notification to Content Author (T-106)
    if content_item["author_id"] != current_user.id:
        notif_msg = (
            f"Your content '{content_item['title']}' was approved!"
            if new_status == "approved"
            else f"Changes were requested on your content '{content_item['title']}'."
        )
        await NotificationRepository.create_notification(
            client=admin_client,
            user_id=content_item["author_id"],
            org_id=current_user.org_id,
            title=f"Review Decision: {new_status.replace('_', ' ').capitalize()}",
            message=notif_msg,
            link_url=f"/content/{content_id}"
        )

    # 4. Log Audit Event (T-105)
    await ReviewRepository.log_audit_event(
        client=admin_client,
        org_id=current_user.org_id,
        actor_id=current_user.id,
        action=f"review.{payload.decision}",
        entity_type="content_item",
        entity_id=content_id,
        metadata={"decision": payload.decision, "notes": payload.notes}
    )

    return {
        "success": True,
        "data": {"review": review},
        "error": None,
        "meta": None
    }


@router.get("/{content_id}/comments")
async def list_comments(
    content_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    admin_client = get_supabase_admin()
    comments = await ReviewRepository.list_comments(admin_client, current_user.org_id, content_id)
    return {
        "success": True,
        "data": {"comments": comments},
        "error": None,
        "meta": {"total": len(comments)}
    }


@router.post("/{content_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    content_id: str,
    payload: CommentCreateRequest,
    current_user: CurrentUser = Depends(require_role("creator", "reviewer", "brand_manager", "admin"))
):
    admin_client = get_supabase_admin()
    content_item = await ContentRepository.get_by_id(admin_client, current_user.org_id, content_id)

    comment = await ReviewRepository.add_comment(
        client=admin_client,
        org_id=current_user.org_id,
        content_id=content_id,
        author_id=current_user.id,
        body=payload.body,
        finding_id=payload.finding_id
    )

    # Trigger notification to content author (T-106)
    if content_item["author_id"] != current_user.id:
        await NotificationRepository.create_notification(
            client=admin_client,
            user_id=content_item["author_id"],
            org_id=current_user.org_id,
            title="New Comment on Draft",
            message=f"{current_user.email} commented on '{content_item['title']}'.",
            link_url=f"/content/{content_id}"
        )

    # Log audit event (T-105)
    await ReviewRepository.log_audit_event(
        client=admin_client,
        org_id=current_user.org_id,
        actor_id=current_user.id,
        action="comment.created",
        entity_type="comment",
        entity_id=comment["id"],
        metadata={"content_id": content_id, "finding_id": payload.finding_id}
    )

    return {
        "success": True,
        "data": {"comment": comment},
        "error": None,
        "meta": None
    }
