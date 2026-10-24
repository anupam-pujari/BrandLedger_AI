"""
BrandProof Unified Data Store & Persistence Layer.

Provides clean data access for:
  - Supabase PostgreSQL (when configured in production / staging)
  - Preloaded local in-memory store (for instant local development without Docker or external DB)

Replaces redundant repository abstractions with direct, testable operations.
"""

from datetime import datetime, timezone
import difflib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from app.config import get_settings
from app.schemas import (
    EntityNotFoundError,
    FindingReasonRequiredError,
    InvalidTransitionError,
    SelfApprovalError,
)

settings = get_settings()

# Path to sample data fixtures
DATA_DIR = Path(__file__).parent.parent / "tests" / "sample_data"


class DataStore:
    """Unified application store supporting Supabase and local instant mock."""

    def __init__(self):
        self._supabase_client = None
        self._init_in_memory()

    def _init_in_memory(self):
        """Seed initial in-memory tables with ApexCloud sample brand dataset."""
        self.organisations: Dict[str, Dict[str, Any]] = {
            "00000000-0000-0000-0000-000000000001": {
                "id": "00000000-0000-0000-0000-000000000001",
                "name": "ApexCloud Technologies",
                "slug": "apexcloud",
                "settings": {
                    "rules_only_mode": False,
                    "ai_provider": "openai",
                    "masking_config": {
                        "mask_emails": True,
                        "mask_phones": True,
                        "mask_confidential": True,
                    },
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        }

        self.users: Dict[str, Dict[str, Any]] = {
            "usr-01": {
                "id": "usr-01",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "email": "creator@apexcloud.io",
                "display_name": "Maya Lin (Content Creator)",
                "role": "creator",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            "usr-02": {
                "id": "usr-02",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "email": "reviewer@apexcloud.io",
                "display_name": "David Ross (Legal & Reviewer)",
                "role": "reviewer",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            "usr-03": {
                "id": "usr-03",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "email": "manager@apexcloud.io",
                "display_name": "Elena Rostova (Brand Manager)",
                "role": "brand_manager",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            "usr-04": {
                "id": "usr-04",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "email": "admin@apexcloud.io",
                "display_name": "Kiran Patel (Admin)",
                "role": "admin",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            "00000000-0000-0000-0000-000000000002": {
                "id": "00000000-0000-0000-0000-000000000002",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "email": "sarah.lin@apexcloud.io",
                "display_name": "Sarah Lin",
                "role": "brand_manager",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            "00000000-0000-0000-0000-000000000003": {
                "id": "00000000-0000-0000-0000-000000000003",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "email": "marcus.vance@apexcloud.io",
                "display_name": "Marcus Vance",
                "role": "creator",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            "00000000-0000-0000-0000-000000000004": {
                "id": "00000000-0000-0000-0000-000000000004",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "email": "elena.rostova@apexcloud.io",
                "display_name": "Elena Rostova",
                "role": "reviewer",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            "00000000-0000-0000-0000-000000000005": {
                "id": "00000000-0000-0000-0000-000000000005",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "email": "david.zhang@apexcloud.io",
                "display_name": "David Zhang",
                "role": "admin",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        }

        self.rules: Dict[str, Dict[str, Any]] = {}
        self.facts: Dict[str, Dict[str, Any]] = {}
        self.terms: Dict[str, Dict[str, Any]] = {}
        self.assets: Dict[str, Dict[str, Any]] = {}
        self.content_items: Dict[str, Dict[str, Any]] = {}
        self.content_versions: Dict[str, Dict[str, Any]] = {}
        self.findings: Dict[str, Dict[str, Any]] = {}
        self.ai_disclosures: Dict[str, List[Dict[str, Any]]] = {}
        self.comments: Dict[str, List[Dict[str, Any]]] = {}
        self.notifications: List[Dict[str, Any]] = []

        self._load_fixtures()

    def _load_fixtures(self):
        """Load fixture JSON files if they exist."""
        org_id = "00000000-0000-0000-0000-000000000001"
        try:
            if (DATA_DIR / "sample_rules.json").exists():
                with open(DATA_DIR / "sample_rules.json", "r", encoding="utf-8") as f:
                    for idx, item in enumerate(json.load(f)):
                        item["org_id"] = org_id
                        rid = item.get("id") or f"rule-{item.get('rule_code', f'r-{idx+1}')}"
                        item["id"] = rid
                        self.rules[rid] = item

            if (DATA_DIR / "sample_facts.json").exists():
                with open(DATA_DIR / "sample_facts.json", "r", encoding="utf-8") as f:
                    for idx, item in enumerate(json.load(f)):
                        item["org_id"] = org_id
                        fid = item.get("id") or f"fact-{item.get('fact_code', f'f-{idx+1}')}"
                        item["id"] = fid
                        if "claim_text" not in item:
                            item["claim_text"] = item.get("content", "")
                        self.facts[fid] = item

            if (DATA_DIR / "sample_terms.json").exists():
                with open(DATA_DIR / "sample_terms.json", "r", encoding="utf-8") as f:
                    t_idx = 1
                    for item in json.load(f):
                        pref = item.get("preferred_term", "")
                        banned_list = item.get("banned_alternatives", [])
                        notes = item.get("notes", "")
                        case_sens = item.get("case_sensitive", False)

                        for b in banned_list:
                            tid = f"trm-{t_idx}"
                            self.terms[tid] = {
                                "id": tid,
                                "org_id": org_id,
                                "term": b,
                                "term_type": "banned",
                                "preferred_replacement": pref,
                                "case_sensitive": case_sens,
                                "notes": notes,
                                "created_at": datetime.now(timezone.utc).isoformat(),
                            }
                            t_idx += 1


            if (DATA_DIR / "sample_brand_palette.json").exists():
                with open(DATA_DIR / "sample_brand_palette.json", "r", encoding="utf-8") as f:
                    palette_data = json.load(f)
                    asset_id = "asset-palette-01"
                    self.assets[asset_id] = {
                        "id": asset_id,
                        "org_id": org_id,
                        "name": "ApexCloud Core Palette",
                        "asset_type": "color_palette",
                        "metadata": palette_data,
                        "usage_notes": "Primary and secondary approved brand color swatches.",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }

            if (DATA_DIR / "sample_drafts.json").exists():
                with open(DATA_DIR / "sample_drafts.json", "r", encoding="utf-8") as f:
                    drafts = json.load(f)
                    for idx, d in enumerate(drafts):
                        cid = d.get("id") or f"draft-{idx+1:02d}"
                        vid = f"ver-{cid}-1"
                        creator_id = "00000000-0000-0000-0000-000000000002"
                        self.content_items[cid] = {
                            "id": cid,
                            "org_id": org_id,
                            "title": d.get("title", f"Sample Draft {idx+1}"),
                            "content_type": d.get("content_type", "text"),
                            "status": "draft",
                            "author_id": creator_id,
                            "current_version": 1,
                            "intent_purpose": d.get("intent", {}).get("purpose", "Brand awareness"),
                            "intent_audience": d.get("intent", {}).get("audience", "Cloud Architects & IT Leaders"),
                            "intent_key_message": d.get("intent", {}).get("key_message", "High performance and reliability"),
                            "rules_only_mode": False,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                            "findings_count": 0,
                        }
                        self.content_versions[vid] = {
                            "id": vid,
                            "content_item_id": cid,
                            "version_number": 1,
                            "body": d.get("body", ""),
                            "created_by": creator_id,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "metadata": {},
                        }
        except Exception as e:
            print(f"[DataStore] Warning loading fixtures: {e}")

    # =========================================================================
    # Rules Operations
    # =========================================================================

    def list_rules(self, org_id: str, category: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        results = [r for r in self.rules.values() if r.get("org_id") == org_id]
        if category and category != "all":
            results = [r for r in results if r.get("category") == category]
        if status and status != "all":
            results = [r for r in results if r.get("status") == status]
        return results

    def get_rule(self, org_id: str, rule_id: str) -> Dict[str, Any]:
        rule = self.rules.get(rule_id)
        if not rule or rule.get("org_id") != org_id:
            raise EntityNotFoundError(f"Rule '{rule_id}' not found.")
        return rule

    def create_rule(self, org_id: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        rule_id = f"rule-{uuid.uuid4().hex[:8]}"
        rule = {
            "id": rule_id,
            "org_id": org_id,
            "rule_code": data.get("rule_code") or f"R-{len(self.rules)+1:02d}",
            "category": data.get("category", "tone"),
            "title": data.get("title", ""),
            "description": data.get("description", ""),
            "severity": data.get("severity", "warning"),
            "good_example": data.get("good_example"),
            "bad_example": data.get("bad_example"),
            "source_document": data.get("source_document"),
            "source_page": data.get("source_page"),
            "source_quote": data.get("source_quote"),
            "status": "approved",
            "created_by": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.rules[rule_id] = rule
        return rule

    def update_rule(self, org_id: str, rule_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        rule = self.get_rule(org_id, rule_id)
        for k, v in updates.items():
            if v is not None:
                rule[k] = v
        rule["updated_at"] = datetime.now(timezone.utc).isoformat()
        return rule

    def delete_rule(self, org_id: str, rule_id: str) -> None:
        self.get_rule(org_id, rule_id)
        del self.rules[rule_id]

    # =========================================================================
    # Facts Operations (Approved Facts Vault)
    # =========================================================================

    def list_facts(self, org_id: str, search: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        results = [f for f in self.facts.values() if f.get("org_id") == org_id]
        if search:
            s = search.lower()
            results = [f for f in results if s in f.get("claim_text", "").lower() or s in f.get("fact_code", "").lower()]
        if status and status != "all":
            if status == "expired":
                results = [f for f in results if f.get("is_expired")]
            elif status == "active":
                results = [f for f in results if not f.get("is_expired")]
        return results

    def get_fact(self, org_id: str, fact_id: str) -> Dict[str, Any]:
        fact = self.facts.get(fact_id)
        if not fact or fact.get("org_id") != org_id:
            raise EntityNotFoundError(f"Fact '{fact_id}' not found.")
        return fact

    def create_fact(self, org_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        fact_id = f"fact-{uuid.uuid4().hex[:8]}"
        text = data.get("content") or data.get("claim_text", "")
        fact = {
            "id": fact_id,
            "org_id": org_id,
            "fact_code": data.get("fact_code") or f"F-{len(self.facts)+1:02d}",
            "claim_text": text,
            "content": text,
            "supporting_quote": data.get("supporting_quote"),
            "source_document": data.get("source_document"),
            "owner_name": data.get("owner_name", "Fact Owner"),
            "owner_email": data.get("owner_email"),
            "valid_from": data.get("valid_from"),
            "valid_until": data.get("valid_until"),
            "status": data.get("status", "active"),
            "tags": data.get("tags") or [],
            "is_expired": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.facts[fact_id] = fact
        return fact

    def update_fact(self, org_id: str, fact_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        fact = self.get_fact(org_id, fact_id)
        for k, v in updates.items():
            if v is not None:
                fact[k] = v
        fact["updated_at"] = datetime.now(timezone.utc).isoformat()
        return fact

    def delete_fact(self, org_id: str, fact_id: str) -> None:
        self.get_fact(org_id, fact_id)
        del self.facts[fact_id]

    # =========================================================================
    # Terms Operations
    # =========================================================================

    def list_terms(self, org_id: str, term_type: Optional[str] = None) -> List[Dict[str, Any]]:
        results = [t for t in self.terms.values() if t.get("org_id") == org_id]
        if term_type and term_type != "all":
            results = [t for t in results if t.get("term_type") == term_type]
        return results

    def create_term(self, org_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        term_id = f"term-{uuid.uuid4().hex[:8]}"
        pref = data.get("preferred_replacement") or data.get("replacement")
        notes = data.get("notes") or data.get("reason")
        term = {
            "id": term_id,
            "org_id": org_id,
            "term": data.get("term", ""),
            "term_type": data.get("term_type", "banned"),
            "preferred_replacement": pref,
            "replacement": pref,
            "case_sensitive": data.get("case_sensitive", False),
            "whole_word": data.get("whole_word", True),
            "notes": notes,
            "reason": notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.terms[term_id] = term
        return term

    def delete_term(self, org_id: str, term_id: str) -> None:
        if term_id in self.terms and self.terms[term_id].get("org_id") == org_id:
            del self.terms[term_id]
        else:
            raise EntityNotFoundError(f"Term '{term_id}' not found.")

    # =========================================================================
    # Brand Assets Operations
    # =========================================================================

    def list_assets(self, org_id: str, asset_type: Optional[str] = None) -> List[Dict[str, Any]]:
        results = [a for a in self.assets.values() if a.get("org_id") == org_id]
        if asset_type and asset_type != "all":
            results = [a for a in results if a.get("asset_type") == asset_type]
        return results

    def create_asset(self, org_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        asset_id = f"asset-{uuid.uuid4().hex[:8]}"
        asset = {
            "id": asset_id,
            "org_id": org_id,
            "name": data.get("name", "Asset"),
            "asset_type": data.get("asset_type", "image"),
            "file_url": data.get("file_url"),
            "thumbnail_url": data.get("thumbnail_url"),
            "metadata": data.get("metadata", {}),
            "usage_notes": data.get("usage_notes"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.assets[asset_id] = asset
        return asset

    def delete_asset(self, org_id: str, asset_id: str) -> None:
        if asset_id in self.assets and self.assets[asset_id].get("org_id") == org_id:
            del self.assets[asset_id]
        else:
            raise EntityNotFoundError(f"Asset '{asset_id}' not found.")

    # =========================================================================
    # Content & Versions Operations
    # =========================================================================

    def list_content(self, org_id: str, status: Optional[str] = None, author_id: Optional[str] = None) -> List[Dict[str, Any]]:
        results = [c for c in self.content_items.values() if c.get("org_id") == org_id]
        if status and status != "all":
            results = [c for c in results if c.get("status") == status]
        if author_id and author_id != "all":
            creator_ids = {author_id}
            if author_id in ["00000000-0000-0000-0000-000000000002", "usr-01"]:
                creator_ids.update(["00000000-0000-0000-0000-000000000002", "usr-01"])
            results = [c for c in results if c.get("author_id") in creator_ids]

        # Attach latest version and findings count
        for c in results:
            vid = f"ver-{c['id']}-{c['current_version']}"
            c["latest_version"] = self.content_versions.get(vid)
            c["findings_count"] = sum(
                1 for f in self.findings.values()
                if f.get("content_item_id") == c["id"] and f.get("status") == "open"
            )
        return results

    def get_content(self, org_id: str, content_id: str) -> Dict[str, Any]:
        item = self.content_items.get(content_id)
        if not item or item.get("org_id") != org_id:
            raise EntityNotFoundError(f"Content item '{content_id}' not found.")
        vid = f"ver-{content_id}-{item['current_version']}"
        item["latest_version"] = self.content_versions.get(vid)
        item["findings_count"] = sum(
            1 for f in self.findings.values()
            if f.get("content_item_id") == content_id and f.get("status") == "open"
        )
        return item

    def create_content(self, org_id: str, author_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        content_id = f"cnt-{uuid.uuid4().hex[:8]}"
        version_id = f"ver-{content_id}-1"
        now = datetime.now(timezone.utc).isoformat()

        content_item = {
            "id": content_id,
            "org_id": org_id,
            "title": data.get("title", "Untitled Draft"),
            "content_type": data.get("content_type", "text"),
            "status": "draft",
            "author_id": author_id,
            "current_version": 1,
            "intent_purpose": data.get("intent_purpose"),
            "intent_audience": data.get("intent_audience"),
            "intent_key_message": data.get("intent_key_message"),
            "rules_only_mode": data.get("rules_only_mode", False),
            "created_at": now,
            "updated_at": now,
            "findings_count": 0,
        }
        version = {
            "id": version_id,
            "content_item_id": content_id,
            "version_number": 1,
            "body": data.get("body", ""),
            "created_by": author_id,
            "created_at": now,
            "metadata": {},
        }

        self.content_items[content_id] = content_item
        self.content_versions[version_id] = version
        content_item["latest_version"] = version
        return content_item

    def update_content(self, org_id: str, content_id: str, body: str, author_id: str) -> Dict[str, Any]:
        item = self.get_content(org_id, content_id)
        new_version_num = item["current_version"] + 1
        new_version_id = f"ver-{content_id}-{new_version_num}"
        now = datetime.now(timezone.utc).isoformat()

        prev_ver = self.get_version(content_id, item["current_version"])
        prev_body = prev_ver.get("body", "") if prev_ver else ""
        diff_str = "".join(difflib.unified_diff(
            prev_body.splitlines(keepends=True),
            body.splitlines(keepends=True),
            fromfile=f"v{item['current_version']}",
            tofile=f"v{new_version_num}"
        )) or "Updated content"

        version = {
            "id": new_version_id,
            "content_item_id": content_id,
            "version_number": new_version_num,
            "body": body,
            "created_by": author_id,
            "created_at": now,
            "metadata": {},
            "diff_from_previous": diff_str,
        }
        self.content_versions[new_version_id] = version
        item["current_version"] = new_version_num
        item["updated_at"] = now
        item["latest_version"] = version
        return item

    def get_version(self, content_id: str, version_number: int) -> Optional[Dict[str, Any]]:
        vid = f"ver-{content_id}-{version_number}"
        return self.content_versions.get(vid)

    # =========================================================================
    # Findings Operations
    # =========================================================================

    def list_findings(self, org_id: str, content_id: str, category: Optional[str] = None, severity: Optional[str] = None) -> List[Dict[str, Any]]:
        findings = [
            f for f in self.findings.values()
            if f.get("content_item_id") == content_id
        ]
        if category and category != "all":
            findings = [f for f in findings if f.get("category") == category]
        if severity and severity != "all":
            findings = [f for f in findings if f.get("severity") == severity]
        return findings

    def save_findings(self, content_id: str, findings: List[Dict[str, Any]]) -> None:
        # Clear existing findings for this content item
        to_del = [fid for fid, f in self.findings.items() if f.get("content_item_id") == content_id]
        for fid in to_del:
            del self.findings[fid]

        for f in findings:
            fid = f.get("id") or f"fnd-{uuid.uuid4().hex[:8]}"
            f["id"] = fid
            f["content_item_id"] = content_id
            self.findings[fid] = f

    def resolve_finding(
        self,
        org_id: str,
        content_id: str,
        finding_id: str,
        status: str,
        dismiss_reason: Optional[str] = None,
        edited_text: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        finding = self.findings.get(finding_id)
        if not finding or finding.get("content_item_id") != content_id:
            raise EntityNotFoundError(f"Finding '{finding_id}' not found.")

        # Mandatory dismissal reason for high-severity findings (planing.txt Line 73 & 100)
        if status == "dismissed" and finding.get("severity") == "critical" and not (dismiss_reason and dismiss_reason.strip()):
            raise FindingReasonRequiredError("Dismissing a critical finding requires a short explanation reason.")

        finding["status"] = status
        finding["dismiss_reason"] = dismiss_reason
        finding["resolved_by"] = user_id
        finding["resolved_at"] = datetime.now(timezone.utc).isoformat()
        if edited_text:
            finding["suggested_fix"] = edited_text

        return finding

    # =========================================================================
    # Review Workflow & State Machine
    # =========================================================================

    def submit_for_review(self, org_id: str, content_id: str, user_id: str) -> Dict[str, Any]:
        item = self.get_content(org_id, content_id)
        if item["status"] not in ["draft", "checked", "changes_requested"]:
            raise InvalidTransitionError(f"Cannot submit content in '{item['status']}' state for review.")
        item["status"] = "in_review"
        item["updated_at"] = datetime.now(timezone.utc).isoformat()
        return item

    def approve_content(self, org_id: str, content_id: str, user_id: str) -> Dict[str, Any]:
        item = self.get_content(org_id, content_id)
        # Self-approval guard (planing.txt Line 84: No one can approve their own content)
        if item.get("author_id") == user_id:
            raise SelfApprovalError("Brand governance policy prevents authors from approving their own content drafts.")

        item["status"] = "approved"
        item["updated_at"] = datetime.now(timezone.utc).isoformat()
        return item

    def request_changes(self, org_id: str, content_id: str, notes: str, user_id: str) -> Dict[str, Any]:
        item = self.get_content(org_id, content_id)
        item["status"] = "changes_requested"
        item["updated_at"] = datetime.now(timezone.utc).isoformat()
        if notes:
            self.add_comment(content_id, user_id, f"Changes requested: {notes}")
        return item

    # =========================================================================
    # AI Disclosures & Audit Log
    # =========================================================================

    def save_ai_disclosure(self, content_id: str, disclosure: Dict[str, Any]) -> None:
        if content_id not in self.ai_disclosures:
            self.ai_disclosures[content_id] = []
        disclosure["id"] = f"disc-{uuid.uuid4().hex[:8]}"
        disclosure["timestamp"] = datetime.now(timezone.utc).isoformat()
        self.ai_disclosures[content_id].append(disclosure)

    def get_ai_disclosures(self, content_id: str) -> List[Dict[str, Any]]:
        return self.ai_disclosures.get(content_id, [])

    # =========================================================================
    # Comments Operations
    # =========================================================================

    def list_comments(self, content_id: str) -> List[Dict[str, Any]]:
        return self.comments.get(content_id, [])

    def add_comment(self, content_id: str, author_id: str, text: str, finding_id: Optional[str] = None) -> Dict[str, Any]:
        user = self.users.get(author_id, {})
        author_name = user.get("display_name", "Team Member")
        cid = f"cmt-{uuid.uuid4().hex[:8]}"
        comment = {
            "id": cid,
            "content_item_id": content_id,
            "author_id": author_id,
            "author_name": author_name,
            "finding_id": finding_id,
            "text": text,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if content_id not in self.comments:
            self.comments[content_id] = []
        self.comments[content_id].append(comment)
        return comment

    # =========================================================================
    # Users & Org Operations
    # =========================================================================

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        for u in self.users.values():
            if u.get("email", "").lower() == email.lower():
                return u
        return None

    def list_users(self, org_id: str, role: Optional[str] = None) -> List[Dict[str, Any]]:
        results = [u for u in self.users.values() if u.get("org_id") == org_id]
        if role and role != "all":
            results = [u for u in results if u.get("role") == role]
        return results

    def invite_user(self, org_id: str, email: str, role: str, display_name: str) -> Dict[str, Any]:
        uid = f"usr-{uuid.uuid4().hex[:8]}"
        user = {
            "id": uid,
            "org_id": org_id,
            "email": email,
            "display_name": display_name,
            "role": role,
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.users[uid] = user
        return user

    def update_user(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        user = self.users.get(user_id)
        if not user:
            raise EntityNotFoundError(f"User '{user_id}' not found.")
        for k, v in updates.items():
            if v is not None:
                user[k] = v
        return user

    def get_org_settings(self, org_id: str) -> Dict[str, Any]:
        org = self.organisations.get(org_id)
        if not org:
            return {
                "rules_only_mode": False,
                "ai_provider": "openai",
                "masking_config": {
                    "mask_emails": True,
                    "mask_phones": True,
                    "mask_confidential": True,
                },
            }
        return org.get("settings", {})

    def update_org_settings(self, org_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        org = self.organisations.get(org_id)
        if not org:
            raise EntityNotFoundError(f"Organization '{org_id}' not found.")
        current_settings = org.setdefault("settings", {})
        current_settings.update({k: v for k, v in updates.items() if v is not None})
        return current_settings


# Global singleton instance
store = DataStore()
