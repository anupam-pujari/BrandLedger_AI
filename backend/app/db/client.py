"""
BrandProof Database & Supabase Client Setup.

Provides connections for:
  - Admin client (service_role key for backend automation, audit logging).
  - User-scoped client (injects active user JWT for PostgreSQL Row-Level Security).
  - In-memory mock engine for offline testing and environments with placeholder credentials.
"""

from typing import Optional, Any, Dict, List
import copy
from app.config import get_settings

try:
    from supabase import create_client as _real_create_client, Client
except ImportError:
    _real_create_client = None
    Client = Any  # type: ignore


# In-memory storage for offline development, local mock, and test runs
_IN_MEMORY_TABLES: Dict[str, List[Dict[str, Any]]] = {
    "organisations": [],
    "users": [],
    "rules": [],
    "facts": [],
    "terms": [],
    "assets": [],
    "content_items": [],
    "content_versions": [],
    "findings": [],
    "reviews": [],
    "comments": [],
    "audit_log": [],
    "rule_health_events": [],
    "notifications": [],
    "ai_disclosures": []
}


class _MockQueryResponse:
    def __init__(self, data: Any):
        self.data = data


class _MockStorageBucket:
    def __init__(self, name: str):
        self.name = name

    def create_signed_url(self, path: str, expires_in: int = 3600) -> Dict[str, str]:
        return {"signedURL": f"https://mock-storage.brandproof.io/{self.name}/{path}?token=mock_signed_token"}


class _MockStorage:
    def from_(self, bucket: str) -> _MockStorageBucket:
        return _MockStorageBucket(bucket)


class _MockTableQuery:
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.filters: List[tuple] = []
        self.limit_val: Optional[int] = None
        self.order_col: Optional[str] = None
        self.order_desc: bool = False
        self.action = "select"
        self.action_data: Any = None

    def select(self, fields: str = "*"):
        self.action = "select"
        return self

    def insert(self, data: Any):
        self.action = "insert"
        self.action_data = data
        return self

    def upsert(self, data: Any):
        self.action = "upsert"
        self.action_data = data
        return self

    def update(self, data: Any):
        self.action = "update"
        self.action_data = data
        return self

    def delete(self):
        self.action = "delete"
        return self

    def eq(self, column: str, value: Any):
        self.filters.append(("eq", column, value))
        return self

    def ilike(self, column: str, pattern: str):
        self.filters.append(("ilike", column, pattern))
        return self

    def order(self, column: str, desc: bool = False):
        self.order_col = column
        self.order_desc = desc
        return self

    def limit(self, count: int):
        self.limit_val = count
        return self

    def _matches_filters(self, row: Dict[str, Any]) -> bool:
        for op, col, val in self.filters:
            if op == "eq":
                if str(row.get(col)) != str(val):
                    return False
            elif op == "ilike":
                search_term = val.replace("%", "").lower()
                field_val = str(row.get(col, "")).lower()
                if search_term not in field_val:
                    return False
        return True

    def execute(self) -> _MockQueryResponse:
        table_rows = _IN_MEMORY_TABLES.setdefault(self.table_name, [])

        if self.action == "insert":
            if isinstance(self.action_data, list):
                inserted = [copy.deepcopy(item) for item in self.action_data]
                table_rows.extend(inserted)
                return _MockQueryResponse(inserted)
            else:
                inserted = copy.deepcopy(self.action_data)
                table_rows.append(inserted)
                return _MockQueryResponse([inserted])

        elif self.action == "upsert":
            items = self.action_data if isinstance(self.action_data, list) else [self.action_data]
            upserted = []
            for item in items:
                item_copy = copy.deepcopy(item)
                item_id = item_copy.get("id")
                existing = None
                if item_id:
                    for r in table_rows:
                        if r.get("id") == item_id:
                            existing = r
                            break
                if existing:
                    existing.update(item_copy)
                    upserted.append(copy.deepcopy(existing))
                else:
                    table_rows.append(item_copy)
                    upserted.append(item_copy)
            return _MockQueryResponse(upserted)

        elif self.action == "update":
            updated_rows = []
            for row in table_rows:
                if self._matches_filters(row):
                    row.update(copy.deepcopy(self.action_data))
                    updated_rows.append(copy.deepcopy(row))
            return _MockQueryResponse(updated_rows)

        elif self.action == "delete":
            kept_rows = [r for r in table_rows if not self._matches_filters(r)]
            deleted_count = len(table_rows) - len(kept_rows)
            _IN_MEMORY_TABLES[self.table_name] = kept_rows
            return _MockQueryResponse([{"deleted": deleted_count}])

        else:  # select
            matched = [copy.deepcopy(r) for r in table_rows if self._matches_filters(r)]
            if self.order_col:
                matched.sort(
                    key=lambda x: str(x.get(self.order_col, "")),
                    reverse=self.order_desc
                )
            if self.limit_val is not None:
                matched = matched[:self.limit_val]
            return _MockQueryResponse(matched)


class _MockPostgrest:
    def auth(self, token: str):
        return self


class MockSupabaseClient:
    def __init__(self, u: str = "", k: str = ""):
        self.url = u
        self.key = k
        self.postgrest = _MockPostgrest()
        self.storage = _MockStorage()

    def table(self, name: str) -> _MockTableQuery:
        return _MockTableQuery(name)

    def rpc(self, name: str, params: dict):
        class _RpcCall:
            def execute(self):
                if name == "match_facts":
                    query_vec = params.get("query_embedding", [])
                    threshold = params.get("match_threshold", 0.65)
                    from app.embeddings.search import search_facts_in_memory
                    facts = _IN_MEMORY_TABLES.get("facts", [])
                    matches = search_facts_in_memory(query_vec, facts, threshold=threshold)
                    return _MockQueryResponse(matches)
                return _MockQueryResponse([])
        return _RpcCall()


_admin_client: Optional[Any] = None


def get_supabase_admin() -> Any:
    """
    Return the Supabase admin client.
    If running offline or with placeholder credentials, returns the in-memory MockSupabaseClient.
    """
    global _admin_client
    if _admin_client is None:
        settings = get_settings()
        url = settings.supabase_url or ""
        is_placeholder = (
            "placeholder" in url.lower() or
            "mock" in url.lower() or
            url.startswith("http://localhost") or
            not _real_create_client
        )
        if is_placeholder:
            _admin_client = MockSupabaseClient(url, settings.supabase_service_key)
        else:
            try:
                _admin_client = _real_create_client(settings.supabase_url, settings.supabase_service_key)
            except Exception:
                _admin_client = MockSupabaseClient(url, settings.supabase_service_key)
    return _admin_client


def get_user_scoped_client(access_token: str) -> Any:
    """
    Create a Supabase client instance scoped to a user JWT.
    """
    settings = get_settings()
    url = settings.supabase_url or ""
    is_placeholder = (
        "placeholder" in url.lower() or
        "mock" in url.lower() or
        url.startswith("http://localhost") or
        not _real_create_client
    )
    if is_placeholder:
        client = MockSupabaseClient(url, settings.supabase_anon_key)
        client.postgrest.auth(access_token)
        return client
    else:
        try:
            client = _real_create_client(settings.supabase_url, settings.supabase_anon_key)
            client.postgrest.auth(access_token)
            return client
        except Exception:
            client = MockSupabaseClient(url, settings.supabase_anon_key)
            client.postgrest.auth(access_token)
            return client
