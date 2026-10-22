"""
Local / Heuristic AI Provider (Fallback & Offline Execution).
Enables tests, CI, and local environments to execute the full AI check pipeline
without incurring external API costs or network latency.
"""

from typing import List, Dict, Any, Optional
import re
from app.ai.base import AIService
from app.engine.schemas.ai_response import (
    AIToneResponse,
    AIToneFinding,
    AIClaimExtractionResponse,
    AISuggestionResponse,
    AIFactValidationResponse
)


class LocalAIProvider(AIService):
    @property
    def provider_name(self) -> str:
        return "local"

    async def check_tone(
        self,
        masked_text: str,
        tone_rules: List[Dict[str, Any]]
    ) -> AIToneResponse:
        findings: List[AIToneFinding] = []
        if not masked_text or not tone_rules:
            return AIToneResponse(findings=[])

        text_lower = masked_text.lower()
        for rule in tone_rules:
            rule_code = rule.get("rule_code", "")
            rule_id = rule.get("id") or rule_code or "rule-unknown"
            desc = rule.get("description", "")
            bad_example = rule.get("bad_example", "")
            good_example = rule.get("good_example", "")

            patterns_to_check: List[str] = []

            # 1. Quoted words in description
            for q in re.findall(r"'([^']+)'", desc):
                if len(q.strip()) > 2:
                    patterns_to_check.append(q.strip())

            # 2. Key phrases in bad example
            if bad_example:
                for p in bad_example.split(","):
                    p_clean = p.strip().strip("'\"")
                    if p_clean and len(p_clean.split()) <= 4:
                        patterns_to_check.append(p_clean)

            # 3. Tone heuristics for hyperbole and competitor disparagement
            if rule_code == "R-02" or "hyperbole" in desc.lower():
                patterns_to_check.extend([
                    "nothing else comes close",
                    "mind-blowing disaster",
                    "mind-blowing",
                    "revolutionary",
                    "game-changing",
                    "miracle"
                ])
            elif rule_code == "R-03" or "competitor" in desc.lower():
                patterns_to_check.extend([
                    "clunky garbage software",
                    "clunky garbage",
                    "clunky",
                    "garbage",
                    "ancient garbage",
                    "clueless legacy"
                ])

            # Deduplicate preserving order (longer phrases first for priority matching)
            patterns_to_check = sorted(list(dict.fromkeys(patterns_to_check)), key=lambda x: len(x), reverse=True)

            for phrase in patterns_to_check:
                pattern = rf"\b{re.escape(phrase)}\b"
                match = re.search(pattern, masked_text, re.IGNORECASE)
                if match:
                    findings.append(AIToneFinding(
                        rule_id=rule_id,
                        flagged_text=match.group(0),
                        explanation=f"Rule {rule_code}: {desc}",
                        severity=rule.get("severity", "warning"),
                        suggested_fix=good_example or f"Use a more {rule.get('title', 'appropriate')} tone",
                        confidence=0.90
                    ))
                    # Avoid overlapping sub-phrase matches for the same rule
                    break

        return AIToneResponse(findings=findings)

    async def extract_claims(
        self,
        masked_text: str
    ) -> AIClaimExtractionResponse:
        if not masked_text:
            return AIClaimExtractionResponse(claims=[])

        # Extract sentences that contain factual assertion patterns (numbers, percentages, superlatives, comparisons)
        sentences = re.split(r"(?<=[.!?])\s+", masked_text.strip())
        claims: List[str] = []

        claim_indicators = [
            r"\b\d+%\b",
            r"\b\d+\s*(?:million|billion|thousand|users|customers|hours|days|x|fold)\b",
            r"\b(?:guarantee|fastest|#1|best|largest|industry-leading|only|proven|certified)\b",
            r"\b(?:more than|less than|over|under|reduced by|increased by|reduces)\b",
            r"\b(?:launched|introduced|partnered with|acquired|compliant with)\b"
        ]

        for sentence in sentences:
            s_clean = sentence.strip()
            if not s_clean or len(s_clean.split()) < 3:
                continue
            if s_clean.endswith("?"):
                continue
            if any(re.search(ind, s_clean, re.IGNORECASE) for ind in claim_indicators):
                claims.append(s_clean)

        return AIClaimExtractionResponse(claims=claims[:10])

    async def validate_claim(
        self,
        claim: str,
        matched_facts: List[Dict[str, Any]]
    ) -> AIFactValidationResponse:
        if not matched_facts:
            return AIFactValidationResponse(
                claim=claim,
                is_supported=False,
                is_conflicting=False,
                confidence=0.5,
                explanation="No corresponding approved fact found in the vault."
            )

        best_fact = matched_facts[0]
        fact_content = best_fact.get("content", "").lower()
        claim_lower = claim.lower()

        # Check for direct conflicts (e.g., contradictory numbers or negations)
        is_conflicting = False
        if ("not" in claim_lower and "not" not in fact_content) or ("not" in fact_content and "not" not in claim_lower):
            is_conflicting = True

        return AIFactValidationResponse(
            claim=claim,
            is_supported=not is_conflicting,
            is_conflicting=is_conflicting,
            confidence=0.92,
            explanation=f"Matched against Approved Fact {best_fact.get('fact_code', '')}: '{best_fact.get('content', '')}'."
        )

    async def generate_suggestion(
        self,
        flagged_text: str,
        issue_description: str,
        rule_or_fact_content: str,
        intent_purpose: Optional[str] = None,
        intent_audience: Optional[str] = None,
        intent_key_message: Optional[str] = None
    ) -> AISuggestionResponse:
        # Build suggestion preserving intent lock
        prefix = f"For {intent_audience}: " if intent_audience else ""
        fix = f"{prefix}{rule_or_fact_content.strip()} (aligned with purpose: {intent_purpose or 'clear communication'})"
        return AISuggestionResponse(
            suggested_fix=fix,
            explanation=f"Suggestion adheres to Intent Lock while resolving: {issue_description}"
        )
