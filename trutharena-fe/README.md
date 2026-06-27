# TruthArena

TruthArena is a decentralized platform for automated fact-checking and investigative journalism. Powered by GenLayer Intelligent Contracts, it utilizes non-deterministic web-browsing capabilities and AI consensus algorithms to evaluate public claims against real-time web sources, bringing transparent truth verification on-chain.

## Overview

Traditional fact-checking is prone to centralized bias, slow turnaround times, and lack of incentive structures. TruthArena solves this by letting users submit public claims, which are then autonomously investigated by an independent pool of AI validators running on GenLayer. The contract securely manages user reputation, stores unalterable investigation records, and contains structural fields to support automated bounty and prediction market infrastructure in future phases.

### Core Architecture Features
* Intelligent Contracts: Implements contract logic natively executing on GenLayer via Python.
* On-Chain Non-Determinism: Dynamically fetches submitted evidence URLs and queries search engines directly from the smart contract layer using gl.nondet.web.get.
* Consensus-Driven AI Verdicts: Utilizes the GenLayer equivalence principle (gl.eq_principle.prompt_comparative) to eliminate individual LLM bias and output unified JSON results.

## Product Roadmap

### Phase 1: Core Consensus and Identity (Current Release)
* Secure decentralized identity setup (register_user) tracking user reputation metrics.
* Public claim ingestion validation pipeline (submit_claim).
* Complete automated AI consensus engine (investigate_claim) with dynamic web context gathering.

### Phase 2: Bounty-Driven Investigative Journalism (Upcoming)
* Financial incentives for deeper verification. Users can attach a GEN token bounty pool to critical claims to incentivize deeper human or AI investigative context.

### Phase 3: Truth Prediction Markets (Upcoming)
* Open decentralization staking markets allowing users to stake positions on whether a disputed public claim will resolve to "verified", "false", or "misleading".

## Architecture and Data Structures

The underlying state machine tracks users, comprehensive claim profiles, and detailed verdict proofs.

### Storage Mappings
* users: TreeMap[str, User] - Wallet Address to User Profile
* username_to_wallet: TreeMap[str, str] - Lowercase Username to Wallet Address
* claims: TreeMap[str, Claim] - Claim ID to Claim Details
* fact_check_results: TreeMap[str, FactCheckResult] - Claim ID to Formal AI Proof Record

### Claim Status Lifecycle Flow
Claims traverse transparent stages as they progress through verification:
pending -> investigating -> verified | false | misleading | unverified

## Smart Contract Interface API

### Write Methods

#### register_user(username: str) -> None
Registers a new platform user account. Initializes their profile with a default reputation_score of 50.
* Constraints: Username length must be between 2 and 30 characters. Usernames must be unique.

#### submit_claim(title: str, claim_text: str, category: str, source_urls: list[str]) -> str
Submits a brand new claim log onto the ledger. 
* Supported Categories: "politics", "finance", "health", "science", "tech", "other"
* Returns: Unique claim_id string (e.g., "claim_1").

#### investigate_claim(claim_id: str) -> None
Triggers the non-deterministic AI validation cluster. Anyone can invoke this transaction. The network executes a background internet lookup to resolve source contents, runs a secondary web search optimization pass via DuckDuckGo, passes the formatted text stack into an evaluation prompt matrix, and updates the core ledger state using an equivalence checking mechanism.

### Read Methods

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| get_user | wallet: str | User | Fetches user profile record by wallet address. |
| user_exists | wallet: str | bool | Fast identity lookups for UI onboarding gating. |
| get_claim | claim_id: str | Claim | Pulls out detailed status logs for an individual claim. |
| get_fact_check_result | claim_id: str | FactCheckResult | Pulls out the formal JSON verdict reasoning and sources checked. |
| get_all_claims | None | list[Claim] | Helper method to pull down the entire list of claims. |
| get_claims_by_status | status: str | list[Claim] | Filtered lookups based on validation status. |
| get_claims_by_category | category: str | list[Claim] | Filtered lookups by topical context tags. |
| get_total_claims | None | i32 | Total claim counter index value. |

## Tech Stack and Dependencies

* Execution Runtime: GenLayer Studionet
* Language Framework: Python (py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6)
* Libraries Used: genlayer, dataclasses, json

## Development and Deployment Instructions

### 1. Requirements Setup
Ensure you have the latest GenLayer toolchain binaries installed locally.

### 2. Contract Initialization
When deploying the contract to the GenLayer ecosystem testnet, provide the initial administrator deployment account:

```bash
genlayer deploy TruthArena.py --args '["0xYourAdminWalletAddressHere"]'