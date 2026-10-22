"""
Insights & Analytics Repository (T-130, T-131, T-132, T-133).
"""

from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone


class InsightRepository:
    EVENTS_TABLE = "rule_health_events"

    @classmethod
    async def log_rule_health_event(
        cls,
        client: Any,
        org_id: str,
        rule_id: str,
        event_type: str,
        content_item_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        reason: Optional[str] = None
    ):
        data = {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "rule_id": rule_id,
            "event_type": event_type,
            "content_item_id": content_item_id,
            "actor_id": actor_id,
            "reason": reason,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        try:
            client.table(cls.EVENTS_TABLE).insert(data).execute()
        except Exception:
            pass

    @classmethod
    async def get_rule_health(
        cls,
        client: Any,
        org_id: str,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        # Fetch approved rules
        rules_query = client.table("rules").select("id, rule_code, title, category").eq("org_id", org_id)
        if category:
            rules_query = rules_query.eq("category", category)
        rules_res = rules_query.execute()
        rules = rules_res.data or []

        # Fetch findings stats grouped by rule_id
        findings_res = client.table("findings").select("rule_id, status").eq("org_id", org_id).execute()
        findings = findings_res.data or []

        stats_by_rule: Dict[str, Dict[str, int]] = {}
        for f in findings:
            r_id = f.get("rule_id")
            if not r_id:
                continue
            if r_id not in stats_by_rule:
                stats_by_rule[r_id] = {"triggered": 0, "accepted": 0, "dismissed": 0}
            stats_by_rule[r_id]["triggered"] += 1
            if f.get("status") == "accepted":
                stats_by_rule[r_id]["accepted"] += 1
            elif f.get("status") == "dismissed":
                stats_by_rule[r_id]["dismissed"] += 1

        results = []
        for r in rules:
            r_id = r["id"]
            stat = stats_by_rule.get(r_id, {"triggered": 0, "accepted": 0, "dismissed": 0})
            total = stat["triggered"]
            accept_rate = round(stat["accepted"] / total, 2) if total > 0 else 1.0
            dismiss_rate = round(stat["dismissed"] / total, 2) if total > 0 else 0.0
            is_unclear = total >= 3 and dismiss_rate > 0.4

            results.append({
                "rule_id": r_id,
                "rule_code": r.get("rule_code", ""),
                "title": r.get("title", ""),
                "category": r.get("category", ""),
                "trigger_count": total,
                "accept_rate": accept_rate,
                "dismiss_rate": dismiss_rate,
                "is_unclear": is_unclear,
                "suggested_rewrite": f"Clarify condition in {r.get('rule_code')} to reduce false triggers." if is_unclear else None
            })

        return results

    @classmethod
    async def get_recurring_mistakes(
        cls,
        client: Any,
        org_id: str,
        group_by: str = "category"
    ) -> List[Dict[str, Any]]:
        findings_res = client.table("findings").select("category, title, severity").eq("org_id", org_id).execute()
        findings = findings_res.data or []

        counts: Dict[str, int] = {}
        top_titles: Dict[str, Dict[str, int]] = {}

        for f in findings:
            key = f.get(group_by) or "general"
            counts[key] = counts.get(key, 0) + 1
            title = f.get("title", "Unknown issue")
            if key not in top_titles:
                top_titles[key] = {}
            top_titles[key][title] = top_titles[key].get(title, 0) + 1

        insights = []
        for key, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            sorted_titles = sorted(top_titles[key].items(), key=lambda x: x[1], reverse=True)[:3]
            insights.append({
                "group": key,
                "total_violations": count,
                "top_issues": [{"title": t[0], "count": t[1]} for t in sorted_titles]
            })

        return insights

    @classmethod
    async def get_dashboard_stats(cls, client: Any, org_id: str) -> Dict[str, Any]:
        # Count content items
        items_res = client.table("content_items").select("id, status").eq("org_id", org_id).execute()
        items = items_res.data or []
        total_content = len(items)
        approved_count = sum(1 for i in items if i.get("status") == "approved")
        approval_rate = round(approved_count / total_content, 2) if total_content > 0 else 1.0

        # Count findings
        findings_res = client.table("findings").select("id, severity, status").eq("org_id", org_id).execute()
        findings = findings_res.data or []
        total_findings = len(findings)
        critical_count = sum(1 for f in findings if f.get("severity") == "critical")
        warning_count = sum(1 for f in findings if f.get("severity") == "warning")

        # Count active rules & facts
        rules_res = client.table("rules").select("id").eq("org_id", org_id).eq("status", "approved").execute()
        facts_res = client.table("facts").select("id, valid_until").eq("org_id", org_id).eq("status", "active").execute()
        facts = facts_res.data or []

        return {
            "total_content_items": total_content,
            "approved_content_items": approved_count,
            "approval_rate": approval_rate,
            "total_findings_detected": total_findings,
            "critical_findings": critical_count,
            "warning_findings": warning_count,
            "active_rules_count": len(rules_res.data or []),
            "active_facts_count": len(facts),
            "review_engine_health": "operational"
        }
