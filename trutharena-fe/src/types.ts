export type Category = 'Politics' | 'Finance' | 'Health' | 'Science' | 'Tech' | 'Other';

export type ClaimStatus = 'pending' | 'investigating' | 'verified' | 'false' | 'misleading' | 'unverified';

export interface AIVerdict {
  verdict: 'Verified' | 'False' | 'Misleading' | 'Unverified';
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
  sourcesChecked: string[];
}

export interface Claim {
  claim_id: string;
  title: string;
  claim_text: string;
  category: Category;
  status: ClaimStatus;
  submitted_at: string;
  resolved_at?: string;
  submitter: string; // wallet address
  source_urls: string[];
  challenge_pool: number;
  support_pool: number
  aiVerdict?: AIVerdict;
  bounty_pool: number;
  market_outcome: string;
  market_status: string;
  market_deadline?: number; // timestamp in milliseconds
}

export interface UserProfile {
  wallet: string;
  username: string;
  total_claims_submitted: number;
  total_investigations: number;
  total_earned_gen: number;
  reputation_score: number;
  joined_at: string;
}

export interface FactCheckResult {
  claim_id: string
  verdict: string           //"verified" | "false" | "misleading" | "unverified"
  confidence: string        // "high" | "medium" | "low"
  reasoning: string
  sources_checked: [string]
  checked_at: string
}


export interface BountySubmission {
  id: string;
  claimId: string;
  submittedBy: string; // wallet address
  username?: string; // custom username
  explanation: string;
  sourceUrls: string[];
  score?: number; // 0-100 assigned by AI validator
  feedback?: string; // AI feedback
  createdAt: string;
}

export interface Investigation {
  
    inv_id: string
    claim_id: string
    investigator: string
    summary: string
    evidence_urls: [string]
    methodology: string
    status: string
    ai_score: number
    ai_feedback: string
    submitted_at: string
    payout: number

}


export interface MarketPosition{
    position_id: string
    claim_id: string
    participant: string
    position: string
    stake_gen: number
    resolved: boolean
    won: boolean
    payout: number
    placed_at: string


}