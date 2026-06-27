export type Category = 'Politics' | 'Finance' | 'Health' | 'Science' | 'Tech' | 'Other';

export type ClaimStatus = 'Pending' | 'Investigating' | 'Verified' | 'False' | 'Misleading' | 'Unverified';

export interface AIVerdict {
  verdict: 'Verified' | 'False' | 'Misleading' | 'Unverified';
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
  sourcesChecked: string[];
}

export interface Claim {
  claim_id: string;
  title: string;
  text: string;
  category: Category;
  status: ClaimStatus;
  submitted_at: string;
  resolvedAt?: string;
  submitter: string; // wallet address
  sourceUrls: string[];
  aiVerdict?: AIVerdict;
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
