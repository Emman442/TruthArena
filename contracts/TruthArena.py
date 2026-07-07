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
    category: str
    source_urls: DynArray[str]
    status: str
    verdict: str
    verdict_reasoning: str
    submitted_at: str
    resolved_at: str
    bounty_pool: i32
    bounty_active: bool
    bounty_deadline: i64
    winning_investigation: str
    support_pool: i32
    challenge_pool: i32
    market_status: str
    market_deadline: i64
    market_outcome: str


@allow_storage
@dataclass
class FactCheckResult:
    claim_id: str
    verdict: str
    confidence: str
    reasoning: str
    sources_checked: DynArray[str]
    checked_at: str


@allow_storage
@dataclass
class Investigation:
    investigation_id: str
    claim_id: str
    investigator: str
    summary: str
    evidence_urls: DynArray[str]
    methodology: str
    status: str
    ai_score: i32
    ai_feedback: str
    submitted_at: str
    payout: i32


@allow_storage
@dataclass
class MarketPosition:
    position_id: str
    claim_id: str
    participant: str
    position: str
    stake_gen: i32
    resolved: bool
    won: bool
    payout: i32
    placed_at: str


class TruthArena(gl.Contract):

    users: TreeMap[str, User]
    username_to_wallet: TreeMap[str, str]

    claims: TreeMap[str, Claim]
    claim_ids: DynArray[str]
    claim_counter: i32

    fact_check_results: TreeMap[str, FactCheckResult]

    investigations: TreeMap[str, Investigation]
    investigation_ids: DynArray[str]
    investigation_counter: i32
    claim_investigations: TreeMap[str, DynArray[str]]

    market_positions: TreeMap[str, MarketPosition]
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

    # ─── User Registration ────────────────────────────────────

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

    # ─── Phase 1: Claim Submission ────────────────────────────

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
            market_deadline=i64(0),
            market_outcome=""
        )

        self.claim_ids.append(claim_id)
        self.users[submitter].total_claims_submitted += i32(1)

        return claim_id

    # ─── Phase 1: AI Fact-Checking ────────────────────────────

    @gl.public.write
    def investigate_claim(self, claim_id: str) -> None:
        assert claim_id in self.claims, "Claim not found"
        c = self.claims[claim_id]
        assert c.status == "pending", "Claim already investigated"

        self.claims[claim_id].status = "investigating"

        claim_text = c.claim_text
        claim_title = c.title
        category = c.category
        source_urls = list(c.source_urls)

        def get_verdict_and_reasoning() -> str:
            fetched_sources = ""
            for url in source_urls:
                try:
                    response = gl.nondet.web.get(url)
                    content = response.body.decode("utf-8")[:2000]
                    fetched_sources += f"\n--- Source: {url} ---\n{content}\n"
                except:
                    pass

            prompt = f"""You are an independent AI fact-checker.

    Category: {category}

    Claim:
    "{claim_text}"

    Web evidence:
    {fetched_sources if fetched_sources else "No web sources — use your own training knowledge."}

    RULES:
    - Be decisive. Only return "unverified" if you have zero knowledge about this topic.
    - Use your training knowledge if web sources are unavailable.

    Return ONLY valid JSON, nothing else:
    {{"verdict":"verified"|"false"|"misleading"|"unverified","reasoning":"one sentence explaining why"}}
    """
            result = gl.nondet.exec_prompt(prompt).strip()
            cleaned = result.replace("```json", "").replace("```", "").strip()
            try:
                import json as _json
                parsed = _json.loads(cleaned)
                verdict = parsed.get("verdict", "unverified")
                if verdict not in ["verified", "false", "misleading", "unverified"]:
                    verdict = "unverified"
                return _json.dumps({
                    "verdict": verdict,
                    "reasoning": str(parsed.get("reasoning", ""))
                }, sort_keys=True, separators=(',', ':'))
            except:
                # Fallback — try to extract verdict from raw text
                lower = cleaned.lower()
                if "false" in lower:
                    v = "false"
                elif "misleading" in lower:
                    v = "misleading"
                elif "verified" in lower and "un" not in lower:
                    v = "verified"
                else:
                    v = "unverified"
                import json as _json
                return _json.dumps({
                    "verdict": v,
                    "reasoning": "AI validators reached consensus"
                }, sort_keys=True, separators=(',', ':'))

        raw = gl.eq_principle.prompt_non_comparative(
            get_verdict_and_reasoning,
            task="Fact-check a public claim and return a verdict with reasoning",
            criteria="Return valid JSON with verdict (verified/false/misleading/unverified) and one sentence reasoning. Be decisive — only return unverified if you have zero knowledge."
        )

        try:
            import json as _json
            data = _json.loads(raw.strip().strip('"').replace('\\"', '"'))
            verdict = data.get("verdict", "unverified")
            reasoning = data.get("reasoning", "")
        except:
            lower = raw.lower()
            if "false" in lower:
                verdict = "false"
            elif "misleading" in lower:
                verdict = "misleading"
            elif "verified" in lower and "un" not in lower:
                verdict = "verified"
            else:
                verdict = "unverified"
            reasoning = "AI validators reached consensus"

        if verdict not in ["verified", "false", "misleading", "unverified"]:
            verdict = "unverified"

        sources: DynArray[str] = []
        for url in source_urls:
            sources.append(url)
        sources.append("GenLayer AI validators - trained knowledge")

        self.fact_check_results[claim_id] = FactCheckResult(
            claim_id=claim_id,
            verdict=verdict,
            confidence="medium",
            reasoning=reasoning,
            sources_checked=sources,
            checked_at=gl.message_raw["datetime"]
        )

        self.claims[claim_id].verdict = verdict
        self.claims[claim_id].verdict_reasoning = reasoning
        self.claims[claim_id].status = verdict
        self.claims[claim_id].resolved_at = gl.message_raw["datetime"]

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

    # ─── Phase 2: Investigation Bounties ─────────────────────

    @gl.public.write.payable
    def add_bounty(self, claim_id: str, deadline_seconds: i64) -> None:
        assert claim_id in self.claims, "Claim not found"

        amount_gen = int(gl.message.value) // (10**18)
        assert amount_gen > 0, "Bounty must be greater than 0"

        now = int(datetime.now(timezone.utc).timestamp() * 1000)

        self.claims[claim_id].bounty_pool += i32(amount_gen)
        self.claims[claim_id].bounty_active = True
        self.claims[claim_id].bounty_deadline = i64(
            now + int(deadline_seconds) * 1000
        )

        if claim_id not in self.claim_investigations:
            self.claim_investigations[claim_id] = []

    @gl.public.write
    def submit_investigation(
        self,
        claim_id: str,
        summary: str,
        evidence_urls: list[str],
        methodology: str
    ) -> str:
        investigator = str(gl.message.sender_address)
        self._only_registered(investigator)

        assert claim_id in self.claims, "Claim not found"
        c = self.claims[claim_id]
        assert c.bounty_active, "No active bounty on this claim"

        now = int(datetime.now(timezone.utc).timestamp() * 1000)
        assert now < int(c.bounty_deadline), "Bounty deadline has passed"

        assert len(summary) >= 50, "Summary too short"
        assert len(evidence_urls) >= 1, "Must provide at least 1 evidence URL"
        assert len(methodology) >= 20, "Methodology too short"

        self.investigation_counter += i32(1)
        inv_id = f"inv_{self.investigation_counter}"

        urls: DynArray[str] = []
        for url in evidence_urls:
            urls.append(url)

        self.investigations[inv_id] = Investigation(
            investigation_id=inv_id,
            claim_id=claim_id,
            investigator=investigator,
            summary=summary,
            evidence_urls=urls,
            methodology=methodology,
            status="submitted",
            ai_score=i32(0),
            ai_feedback="",
            submitted_at=gl.message_raw["datetime"],
            payout=i32(0)
        )

        self.investigation_ids.append(inv_id)
        self.claim_investigations[claim_id].append(inv_id)
        self.users[investigator].total_investigations += i32(1)

        return inv_id

    @gl.public.write
    def evaluate_investigations(self, claim_id: str) -> None:
        assert claim_id in self.claims, "Claim not found"
        c = self.claims[claim_id]
        assert c.bounty_active, "No active bounty"

        now = int(datetime.now(timezone.utc).timestamp() * 1000)
        assert now >= int(c.bounty_deadline), "Bounty deadline not reached yet"
        assert claim_id in self.claim_investigations, "No investigations submitted"

        inv_ids = list(self.claim_investigations[claim_id])
        assert len(inv_ids) > 0, "No investigations to evaluate"

        claim_text = c.claim_text
        claim_title = c.title

        best_score = -1
        best_inv_id = ""

        for inv_id in inv_ids:
            inv = self.investigations[inv_id]
            summary = inv.summary
            methodology = inv.methodology
            evidence_urls = list(inv.evidence_urls)

            def score_investigation(
                s=summary, m=methodology, urls=evidence_urls,
                ct=claim_text, ttl=claim_title
            ) -> str:
                fetched_evidence = ""
                for url in urls:
                    try:
                        response = gl.nondet.web.get(url)
                        content = response.body.decode("utf-8")[:2000]
                        fetched_evidence += f"\n--- Evidence: {url} ---\n{content}\n"
                    except:
                        fetched_evidence += f"\n--- Evidence: {url} ---\nCould not fetch\n"

                prompt = f"""You are evaluating an investigation submission for a fact-checking bounty.

Original claim:
"{ct}"

Investigation Summary:
{s}

Investigator Methodology:
{m}

Fetched Evidence:
{fetched_evidence if fetched_evidence else "No evidence could be fetched"}

Score this investigation from 0 to 100 based on:
- Evidence quality (30%): How credible, verifiable, and relevant is the evidence?
- Investigation depth (25%): How thoroughly does it explore the claim?
- Credibility (25%): How well-sourced and objective is the analysis?
- Relevance (20%): How directly does it address the specific claim?

Return ONLY valid JSON:
{{"score":<int 0-100>,"feedback":"2-3 sentences of constructive feedback"}}
"""
                result = gl.nondet.exec_prompt(prompt).strip()
                cleaned = result.replace("```json", "").replace("```", "").strip()
                try:
                    parsed = json.loads(cleaned)
                    return json.dumps({
                        "score": max(0, min(100, int(parsed.get("score", 0)))),
                        "feedback": str(parsed.get("feedback", ""))
                    }, sort_keys=True, separators=(',', ':'))
                except:
                    return json.dumps({
                        "score": 0,
                        "feedback": "Could not parse evaluation"
                    }, sort_keys=True, separators=(',', ':'))

            raw = gl.eq_principle.prompt_comparative(
                score_investigation,
                principle="""Score investigations objectively based on evidence quality,
research depth, credibility of sources, and relevance to the claim.
Higher scores should reflect genuinely strong investigative work."""
            )

            try:
                data = json.loads(raw)
                score = int(data.get("score", 0))
                feedback = data.get("feedback", "")
            except:
                score = 0
                feedback = "Parse error during evaluation"

            self.investigations[inv_id].ai_score = i32(score)
            self.investigations[inv_id].ai_feedback = feedback
            self.investigations[inv_id].status = "evaluated"

            if score > best_score:
                best_score = score
                best_inv_id = inv_id

        if best_inv_id:
            winner_inv = self.investigations[best_inv_id]
            winner_wallet = winner_inv.investigator
            bounty = int(c.bounty_pool)

            self.investigations[best_inv_id].status = "winner"
            self.investigations[best_inv_id].payout = i32(bounty)

            self.claims[claim_id].winning_investigation = best_inv_id
            self.claims[claim_id].bounty_active = False

            if winner_wallet in self.users:
                self.users[winner_wallet].total_earned_gen += i32(bounty)
                self.users[winner_wallet].reputation_score += i32(20)

            payout_wei = u256(bounty) * u256(10**18)
            _Recipient(Address(winner_wallet)).emit_transfer(value=payout_wei)

    @gl.public.view
    def get_investigation(self, inv_id: str) -> Investigation:
        assert inv_id in self.investigations, "Investigation not found"
        return gl.storage.copy_to_memory(self.investigations[inv_id])

    @gl.public.view
    def get_claim_investigations(self, claim_id: str) -> list[Investigation]:
        result = []
        if claim_id in self.claim_investigations:
            for inv_id in self.claim_investigations[claim_id]:
                result.append(gl.storage.copy_to_memory(self.investigations[inv_id]))
        return result

    # ─── Phase 3: Truth Markets ───────────────────────────────

    @gl.public.write
    def open_truth_market(self, claim_id: str, deadline_seconds: i64) -> None:
        assert claim_id in self.claims, "Claim not found"
        c = self.claims[claim_id]
        assert c.market_status == "", "Market already open or resolved"

        now = int(datetime.now(timezone.utc).timestamp() * 1000)

        self.claims[claim_id].market_status = "open"
        self.claims[claim_id].market_deadline = i64(
            now + int(deadline_seconds) * 1000
        )

        if claim_id not in self.claim_positions:
            self.claim_positions[claim_id] = []

    @gl.public.write.payable
    def take_position(self, claim_id: str, position: str) -> str:
        participant = str(gl.message.sender_address)
        self._only_registered(participant)

        assert claim_id in self.claims, "Claim not found"
        c = self.claims[claim_id]
        assert c.market_status == "open", "Market not open"

        now = int(datetime.now(timezone.utc).timestamp() * 1000)
        assert now < int(c.market_deadline), "Market has closed"
        assert position in ["support", "challenge"], "Position must be support or challenge"

        amount_gen = int(gl.message.value) // (10**18)
        assert amount_gen > 0, "Stake must be greater than 0"

        self.position_counter += i32(1)
        pos_id = f"pos_{self.position_counter}"

        self.market_positions[pos_id] = MarketPosition(
            position_id=pos_id,
            claim_id=claim_id,
            participant=participant,
            position=position,
            stake_gen=i32(amount_gen),
            resolved=False,
            won=False,
            payout=i32(0),
            placed_at=gl.message_raw["datetime"]
        )

        self.claim_positions[claim_id].append(pos_id)

        if position == "support":
            self.claims[claim_id].support_pool += i32(amount_gen)
        else:
            self.claims[claim_id].challenge_pool += i32(amount_gen)

        return pos_id

    @gl.public.write
    def resolve_truth_market(self, claim_id: str) -> None:
        assert claim_id in self.claims, "Claim not found"
        c = self.claims[claim_id]
        assert c.market_status == "open", "Market not open"

        now = int(datetime.now(timezone.utc).timestamp() * 1000)
        assert now >= int(c.market_deadline), "Market deadline not reached"
        assert claim_id in self.claim_positions, "No positions taken"

        pos_ids = list(self.claim_positions[claim_id])
        assert len(pos_ids) > 0, "No positions to resolve"

        claim_text = c.claim_text
        source_urls = list(c.source_urls)
        category = c.category

        def get_market_verdict() -> str:
            fetched_sources = ""
            for url in source_urls:
                try:
                    response = gl.nondet.web.get(url)
                    content = response.body.decode("utf-8")[:2000]
                    fetched_sources += f"\n--- Source: {url} ---\n{content}\n"
                except:
                    pass

            prompt = f"""You are resolving a truth market. Your verdict determines
    who wins a financial stake pool. Be decisive.

    Category: {category}

    Claim:
    "{claim_text}"

    Web evidence:
    {fetched_sources if fetched_sources else "No web sources — use your own training knowledge."}

    RULES:
    - Be decisive. Use your training knowledge if web sources fail.
    - Only return "unverified" if you have absolutely zero knowledge about this topic.

    Verdicts:
    - "true" = claim is verified, SUPPORT side wins
    - "false" = claim is factually wrong, CHALLENGE side wins
    - "misleading" = claim lacks context or is deceptive, CHALLENGE side wins
    - "unverified" = you have zero knowledge, ALL positions refunded

    Reply with ONLY one word: true, false, misleading, or unverified
    """
            result = gl.nondet.exec_prompt(prompt).strip().lower().strip('"')
            if "false" in result:
                return "false"
            elif "misleading" in result:
                return "misleading"
            elif "true" in result and "un" not in result:
                return "true"
            else:
                return "unverified"

        verdict_raw = gl.eq_principle.prompt_non_comparative(
            get_market_verdict,
            task="Determine if a claim is true or false to resolve a truth market",
            criteria="Return exactly one word: true, false, misleading, or unverified. Use training knowledge if web sources fail. Only return unverified if you have zero knowledge."
        )

        verdict = verdict_raw.strip().strip('"').lower()
        if "false" in verdict:
            verdict = "false"
        elif "misleading" in verdict:
            verdict = "misleading"
        elif "true" in verdict and "un" not in verdict:
            verdict = "true"
        else:
            verdict = "unverified"

        self.claims[claim_id].market_outcome = verdict
        self.claims[claim_id].market_status = "resolved"

        if self.claims[claim_id].verdict == "":
            verdict_map = {
                "true": "verified",
                "false": "false",
                "misleading": "misleading",
                "unverified": "unverified"
            }
            self.claims[claim_id].verdict = verdict_map.get(verdict, "unverified")
            self.claims[claim_id].status = verdict_map.get(verdict, "unverified")
            self.claims[claim_id].resolved_at = gl.message_raw["datetime"]

        if verdict == "unverified":
            for pos_id in pos_ids:
                p = self.market_positions[pos_id]
                refund = u256(p.stake_gen) * u256(10**18)
                _Recipient(Address(p.participant)).emit_transfer(value=refund)
                self.market_positions[pos_id].resolved = True
                self.market_positions[pos_id].payout = p.stake_gen
            return

        winning_side = "support" if verdict == "true" else "challenge"
        total_pool = int(c.support_pool) + int(c.challenge_pool)
        winning_pool = int(c.support_pool) if winning_side == "support" else int(c.challenge_pool)

        if winning_pool == 0:
            for pos_id in pos_ids:
                p = self.market_positions[pos_id]
                refund = u256(p.stake_gen) * u256(10**18)
                _Recipient(Address(p.participant)).emit_transfer(value=refund)
                self.market_positions[pos_id].resolved = True
                self.market_positions[pos_id].payout = p.stake_gen
            return

        for pos_id in pos_ids:
            p = self.market_positions[pos_id]
            if p.position == winning_side:
                payout_gen = int(p.stake_gen) * total_pool // winning_pool
                self.market_positions[pos_id].won = True
                self.market_positions[pos_id].payout = i32(payout_gen)
                self.market_positions[pos_id].resolved = True
                payout_wei = u256(payout_gen) * u256(10**18)
                _Recipient(Address(p.participant)).emit_transfer(value=payout_wei)
                if p.participant in self.users:
                    profit = payout_gen - int(p.stake_gen)
                    if profit > 0:
                        self.users[p.participant].total_earned_gen += i32(profit)
                    self.users[p.participant].reputation_score += i32(10)
            else:
                self.market_positions[pos_id].resolved = True
                self.market_positions[pos_id].won = False
                self.market_positions[pos_id].payout = i32(0)


    @gl.public.view
    def get_position(self, pos_id: str) -> MarketPosition:
        assert pos_id in self.market_positions, "Position not found"
        return gl.storage.copy_to_memory(self.market_positions[pos_id])

    @gl.public.view
    def get_claim_positions(self, claim_id: str) -> list[MarketPosition]:
        result = []
        if claim_id in self.claim_positions:
            for pos_id in self.claim_positions[claim_id]:
                result.append(gl.storage.copy_to_memory(self.market_positions[pos_id]))
        return result

    @gl.public.view
    def get_market_summary(self, claim_id: str) -> list[i32]:
        assert claim_id in self.claims, "Claim not found"
        c = self.claims[claim_id]
        return [c.support_pool, c.challenge_pool]