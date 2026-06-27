# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
from datetime import datetime, timezone
import json


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass


# ─── Data Structures (shared across all phases) ───────────────

@allow_storage
@dataclass
class User:
    wallet: str
    username: str
    total_claims_submitted: i32
    total_investigations: i32
    total_earned_gen: i32
    reputation_score: i32
    joined_at: str


@allow_storage
@dataclass
class Claim:
    claim_id: str
    submitter: str
    title: str
    claim_text: str
    category: str       # "politics" | "finance" | "health" | "science" | "tech" | "other"
    source_urls: DynArray[str]
    status: str         # "pending" | "investigating" | "verified" | "false" | "misleading" | "unverified"
    verdict: str
    verdict_reasoning: str
    submitted_at: str
    resolved_at: str
    # Phase 2 fields
    bounty_pool: i32
    bounty_active: bool
    bounty_deadline: i64
    winning_investigation: str
    # Phase 3 fields
    support_pool: i32
    challenge_pool: i32
    market_status: str  # "" | "open" | "resolved"
    market_outcome: str # "" | "true" | "false" | "misleading"


@allow_storage
@dataclass
class VerdictEvidence:
    url: str
    description: str


@allow_storage
@dataclass
class FactCheckResult:
    claim_id: str
    verdict: str            # "verified" | "false" | "misleading" | "unverified"
    confidence: str         # "high" | "medium" | "low"
    reasoning: str
    sources_checked: DynArray[str]
    checked_at: str


class TruthArena(gl.Contract):

    # ─── Storage ──────────────────────────────────────────────

    # Users
    users: TreeMap[str, User]
    username_to_wallet: TreeMap[str, str]

    claims: TreeMap[str, Claim]
    claim_ids: DynArray[str]
    claim_counter: i32

    fact_check_results: TreeMap[str, FactCheckResult]

    investigation_ids: DynArray[str]
    investigation_counter: i32
    claim_investigations: TreeMap[str, DynArray[str]]

    position_counter: i32

    claim_positions: TreeMap[str, DynArray[str]]

    admin: str

    def __init__(self, admin_address: str):
        self.admin = admin_address
        self.claim_counter = i32(0)
        self.investigation_counter = i32(0)
        self.position_counter = i32(0)

    def _only_admin(self) -> None:
        assert str(gl.message.sender_address) == self.admin, "Only admin"

    def _only_registered(self, wallet: str) -> None:
        assert wallet in self.users, "User not registered"

    @gl.public.write
    def register_user(self, username: str) -> None:
        wallet = str(gl.message.sender_address)
        assert wallet not in self.users, "Already registered"
        assert 2 <= len(username) <= 30, "Username must be 2-30 chars"
        normalized = username.lower().strip()
        assert normalized not in self.username_to_wallet, "Username taken"

        self.users[wallet] = User(
            wallet=wallet,
            username=normalized,
            total_claims_submitted=i32(0),
            total_investigations=i32(0),
            total_earned_gen=i32(0),
            reputation_score=i32(50),
            joined_at=gl.message_raw["datetime"]
        )
        self.username_to_wallet[normalized] = wallet

    @gl.public.view
    def get_user(self, wallet: str) -> User:
        assert wallet in self.users, "User not found"
        return gl.storage.copy_to_memory(self.users[wallet])

    @gl.public.view
    def user_exists(self, wallet: str) -> bool:
        return wallet in self.users


    @gl.public.write
    def submit_claim(
        self,
        title: str,
        claim_text: str,
        category: str,
        source_urls: list[str]
    ) -> str:
        submitter = str(gl.message.sender_address)
        self._only_registered(submitter)

        assert len(title) >= 5, "Title too short"
        assert len(title) <= 200, "Title too long"
        assert len(claim_text) >= 20, "Claim text too short"
        assert len(claim_text) <= 1000, "Claim text too long"
        assert category in [
            "politics", "finance", "health", "science", "tech", "other"
        ], "Invalid category"

        self.claim_counter += i32(1)
        claim_id = f"claim_{self.claim_counter}"

        urls: DynArray[str] = []
        for url in source_urls:
            urls.append(url)

        self.claims[claim_id] = Claim(
            claim_id=claim_id,
            submitter=submitter,
            title=title,
            claim_text=claim_text,
            category=category,
            source_urls=urls,
            status="pending",
            verdict="",
            verdict_reasoning="",
            submitted_at=gl.message_raw["datetime"],
            resolved_at="",
            bounty_pool=i32(0),
            bounty_active=False,
            bounty_deadline=i64(0),
            winning_investigation="",
            support_pool=i32(0),
            challenge_pool=i32(0),
            market_status="",
            market_outcome=""
        )

        self.claim_ids.append(claim_id)
        self.users[submitter].total_claims_submitted += i32(1)

        return claim_id


    @gl.public.write
    def investigate_claim(self, claim_id: str) -> None:
        """
        Triggers AI validators to investigate the claim.
        Validators fetch source URLs, search for evidence,
        and reach consensus on the verdict.
        Anyone can trigger this — no financial stake required.
        """
        assert claim_id in self.claims, "Claim not found"
        c = self.claims[claim_id]
        assert c.status == "pending", "Claim already investigated"

        self.claims[claim_id].status = "investigating"

        claim_text = c.claim_text
        claim_title = c.title
        category = c.category
        source_urls = list(c.source_urls)

        def run_investigation() -> str:
            # Fetch all submitted source URLs
            fetched_sources = ""
            for url in source_urls:
                try:
                    response = gl.nondet.web.get(url)
                    content = response.body.decode("utf-8")[:2000]
                    fetched_sources += f"\n--- Source: {url} ---\n{content}\n"
                except:
                    fetched_sources += f"\n--- Source: {url} ---\nCould not fetch\n"

            # Also search for additional context
            search_query = claim_title.replace(" ", "+")
            additional_context = ""
            try:
                search_url = f"https://html.duckduckgo.com/html/?q={search_query}"
                response = gl.nondet.web.get(search_url)
                additional_context = response.body.decode("utf-8")[:3000]
            except:
                additional_context = "Could not fetch search results"

            prompt = f"""You are an independent AI fact-checker tasked with verifying a public claim.

Category: {category}

Claim to investigate:
"{claim_text}"

Evidence from submitted sources:
{fetched_sources if fetched_sources else "No sources provided"}

Additional context from web search:
{additional_context}

Your task:
Carefully evaluate the claim against available evidence.
Be thorough, objective, and precise.

Verdict options:
- "verified": The claim is accurate and well-supported by evidence
- "false": The claim is factually incorrect based on available evidence
- "misleading": The claim contains truth but is framed deceptively or lacks critical context
- "unverified": Insufficient evidence exists to confirm or deny the claim

Confidence levels:
- "high": Strong, clear evidence supports your verdict
- "medium": Moderate evidence, some ambiguity remains
- "low": Limited evidence, verdict is tentative

Return ONLY valid JSON:
{{"verdict":"verified"|"false"|"misleading"|"unverified","confidence":"high"|"medium"|"low","reasoning":"2-4 sentences explaining your verdict with specific evidence references","sources_checked":["list of URLs or sources consulted"]}}
"""
            result = gl.nondet.exec_prompt(prompt).strip()
            cleaned = result.replace("```json", "").replace("```", "").strip()
            try:
                parsed = json.loads(cleaned)
                return json.dumps({
                    "verdict": parsed.get("verdict", "unverified"),
                    "confidence": parsed.get("confidence", "low"),
                    "reasoning": str(parsed.get("reasoning", "")),
                    "sources_checked": parsed.get("sources_checked", [])
                }, sort_keys=True, separators=(',', ':'))
            except:
                return json.dumps({
                    "verdict": "unverified",
                    "confidence": "low",
                    "reasoning": "Could not parse AI response",
                    "sources_checked": []
                }, sort_keys=True, separators=(',', ':'))

        raw = gl.eq_principle.prompt_comparative(
            run_investigation,
            principle="""The verdict must be based strictly on verifiable evidence.
Only mark as verified if evidence clearly supports the claim.
Only mark as false if evidence clearly contradicts it.
Mark as misleading if the claim is technically true but lacks context or is framed deceptively.
Mark as unverified if evidence is insufficient.
Be rigorous and objective."""
        )

        try:
            data = json.loads(raw)
        except:
            data = {
                "verdict": "unverified",
                "confidence": "low",
                "reasoning": "Consensus parse error",
                "sources_checked": []
            }

        verdict = data.get("verdict", "unverified")
        reasoning = data.get("reasoning", "")
        confidence = data.get("confidence", "low")

        sources: DynArray[str] = []
        for s in data.get("sources_checked", []):
            sources.append(str(s))

        self.fact_check_results[claim_id] = FactCheckResult(
            claim_id=claim_id,
            verdict=verdict,
            confidence=confidence,
            reasoning=reasoning,
            sources_checked=sources,
            checked_at=gl.message_raw["datetime"]
        )

        self.claims[claim_id].verdict = verdict
        self.claims[claim_id].verdict_reasoning = reasoning
        self.claims[claim_id].status = verdict
        self.claims[claim_id].resolved_at = gl.message_raw["datetime"]

        # Boost submitter reputation if claim was valid (not unverified)
        submitter = c.submitter
        if submitter in self.users:
            if verdict in ["verified", "false", "misleading"]:
                self.users[submitter].reputation_score += i32(5)

    # ─── Phase 1: Read Methods ────────────────────────────────

    @gl.public.view
    def get_claim(self, claim_id: str) -> Claim:
        assert claim_id in self.claims, "Claim not found"
        return gl.storage.copy_to_memory(self.claims[claim_id])

    @gl.public.view
    def get_fact_check_result(self, claim_id: str) -> FactCheckResult:
        assert claim_id in self.fact_check_results, "No result yet"
        return gl.storage.copy_to_memory(self.fact_check_results[claim_id])

    @gl.public.view
    def get_all_claims(self) -> list[Claim]:
        result = []
        for cid in self.claim_ids:
            result.append(gl.storage.copy_to_memory(self.claims[cid]))
        return result

    @gl.public.view
    def get_claims_by_status(self, status: str) -> list[Claim]:
        result = []
        for cid in self.claim_ids:
            c = self.claims[cid]
            if c.status == status:
                result.append(gl.storage.copy_to_memory(c))
        return result

    @gl.public.view
    def get_claims_by_category(self, category: str) -> list[Claim]:
        result = []
        for cid in self.claim_ids:
            c = self.claims[cid]
            if c.category == category:
                result.append(gl.storage.copy_to_memory(c))
        return result

    @gl.public.view
    def get_total_claims(self) -> i32:
        return self.claim_counter

