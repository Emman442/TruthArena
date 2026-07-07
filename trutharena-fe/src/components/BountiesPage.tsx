import React, { useState, useEffect } from "react";
import { Award, DollarSign, Send, Shield, Users, Search, Plus, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Claim, BountySubmission } from "../types";
import { useFetchClaimInvestigations, useFetchClaims } from "../hooks/TruthArena";
import getUserBalance from "../lib/contract/TruthArena"

interface BountiesPageProps {
  claims: Claim[];
  isConnected: boolean;
  walletAddress: string;
  onConnectClick: () => void;
  onNavigate: (path: string) => void;
  fetchClaims: () => void;
  addToast: (msg: string, type: "success" | "error") => void;
}

export default function BountiesPage({
  isConnected,
  walletAddress,
  onConnectClick,
  onNavigate,
  addToast
}: BountiesPageProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const { isPending: isFetchingClaims, data: claims } = useFetchClaims()
  const { isPending: isFetchingClaimInvestigation, data: claimInvestigations } = useFetchClaimInvestigations(selectedClaimId!)
  const [fundingAmount, setFundingAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [sourceUrls, setSourceUrls] = useState<string[]>([""]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddSourceField = () => {
    setSourceUrls([...sourceUrls, ""]);
  };


  const handleSourceUrlChange = (index: number, val: string) => {
    const updated = [...sourceUrls];
    updated[index] = val;
    setSourceUrls(updated);
  };

  const handleFundBounty = async (e: React.FormEvent, claimId: string) => {
    e.preventDefault();
    const amount = parseInt(fundingAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast("Please enter a valid positive GEN amount.", "error");
      return;
    }

    if (!isConnected) {
      onConnectClick();
      return;
    }

    if (userProfile && userProfile.genBalance < amount) {
      addToast("Insufficient GEN balance in your wallet.", "error");
      return;
    }

    setIsFunding(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/bounty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, userAddress: walletAddress })
      });

      if (res.ok) {
        addToast(`Successfully funded bounty pool with ${amount} GEN!`, "success");
        setFundingAmount("");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to fund bounty", "error");
      }
    } catch (err) {
      addToast("Network or blockchain transmission error.", "error");
    } finally {
      setIsFunding(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent, claimId: string) => {
    e.preventDefault();
    if (explanation.trim().length < 20) {
      addToast("Your explanation must be at least 20 characters long.", "error");
      return;
    }

    if (!isConnected) {
      onConnectClick();
      return;
    }

    setIsSubmittingReport(true);
  };

  const selectedClaim = claims?.find((c) => c.claim_id === selectedClaimId);

  // Filter claims that have bounties or are searchable
  const activeBountyClaims = claims?.filter((c) => (c.bounty_pool || 0) > 0);
  const displayedClaims = searchQuery.trim() === ""
    ? activeBountyClaims
    : claims?.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.text.toLowerCase().includes(searchQuery.toLowerCase()));

  // Find the winner submission (highest score) if resolved
  const getWinnerReport = () => {
    if (!claimInvestigations || claimInvestigations.length === 0) return null;
    return [...claimInvestigations].sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))[0];
  };

  return (
    <div id="bounties-page-container" className="py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-12">
      {/* Page Header */}
      <div id="bounties-header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-[#e5e5e5]">
        <div className="space-y-2">
          <h2 id="bounties-title" className="text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
            Investigation Bounties
          </h2>
          <p id="bounties-subtitle" className="text-sm text-[#6b7280]">
            Attach GEN tokens to critical claims. Researchers submit rigorous evidence, AI scores report quality, and top investigators earn rewards.
          </p>
        </div>

        {/* User Balance Bar */}
        <div className="flex-shrink-0">
          {isConnected ? (
            <div className="border border-black bg-white px-5 py-3 font-mono text-xs flex flex-col gap-1">
              <span className="text-[#6b7280] uppercase tracking-wider text-[10px]">Your Wallet Balance</span>
              <span className="text-sm font-bold text-[#0a0a0a]">
                {"0"} GEN
              </span>
            </div>
          ) : (
            <button
              id="bounties-connect-btn"
              onClick={onConnectClick}
              className="px-5 py-3 border border-black font-mono text-xs font-bold hover:bg-[#f3f3f3]"
            >
              Connect Wallet to Participate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 1/3: List of Bounties */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#0a0a0a] flex items-center gap-2">
              <Award className="w-5 h-5" />
              Active Bounties
            </h3>

            {/* Search filter to fund any claim */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9ca3af]" />
              <input
                id="search-claims-bounties"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims to fund..."
                className="w-full pl-9 pr-4 py-2 border border-black text-xs text-[#0a0a0a] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div id="bounties-list" className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {displayedClaims?.length > 0 ? (
              displayedClaims?.map((claim) => {
                const isActive = claim.claim_id === selectedClaimId;
                const winner = getWinnerReport();
                const subCount = claimInvestigations?.length || 0;

                return (
                  <button
                    key={claim.claim_id}
                    id={`bounty-card-${claim.claim_id}`}
                    onClick={() => {
                      setSelectedClaimId(claim.claim_id);
                      setExplanation("");
                      setSourceUrls([""]);
                    }}
                    className={`w-full text-left p-5 border transition-all ${isActive
                        ? "border-black bg-[#fdfdfd] ring-1 ring-black shadow-xs"
                        : "border-[#e5e5e5] bg-white hover:border-black"
                      }`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <span className="text-[10px] bg-[#f3f3f3] text-[#6b7280] px-2 py-0.5 font-mono font-bold uppercase">
                        {claim.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-black flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {claim.bounty_pool?.toLocaleString() || "0"} GEN
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#0a0a0a] mb-3 line-clamp-2">
                      {claim.title}
                    </h4>

                    <div className="flex items-center justify-between pt-3 border-t border-[#f3f3f3] text-[11px] font-mono text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {subCount} {subCount === 1 ? "report" : "reports"}
                      </span>
                      <span>
                        {claim.status === "pending" || claim.status === "investigating" ? (
                          <span className="text-amber-600 font-bold">ACTIVE</span>
                        ) : (
                          <span className="text-green-600 font-bold">RESOLVED</span>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 border border-dashed border-[#e5e5e5] bg-[#f9f9f9] px-4">
                <p className="text-xs font-mono text-[#6b7280]">No active claims found with GEN bounties.</p>
                <p className="text-[10px] font-mono text-[#9ca3af] mt-1">Search above to find and fund any pending claim!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 2/3: Selected Bounty Details & Report Submission */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClaim ? (
            <div id="selected-bounty-panel" className="border border-black bg-white p-6 sm:p-8 space-y-8">

              {/* Claim Overview */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs font-mono text-[#6b7280]">
                    CLAIM ID: {selectedClaim.claim_id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#6b7280]">Status:</span>
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 bg-[#f3f3f3]">
                      {selectedClaim.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-[#0a0a0a] leading-snug">
                  {selectedClaim.title}
                </h3>

                <p className="text-sm text-[#6b7280] leading-relaxed">
                  {selectedClaim.text}
                </p>

                <div className="flex items-center justify-between p-4 bg-[#f9f9f9] border border-[#e5e5e5] font-mono text-xs">
                  <span className="text-[#6b7280]">Total Bounty Pool:</span>
                  <span className="text-sm font-bold text-[#0a0a0a]">
                    {selectedClaim.bounty_pool?.toLocaleString() || "0"} GEN
                  </span>
                </div>
              </div>

              {/* Fund Bounty Form */}
              <div className="border-t border-[#e5e5e5] pt-6 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6b7280]">
                  Increase Bounty Pool
                </h4>
                <form onSubmit={(e) => handleFundBounty(e, selectedClaim.claim_id)} className="flex gap-2 max-w-sm">
                  <input
                    id="fund-bounty-input"
                    type="number"
                    required
                    min="1"
                    placeholder="Enter GEN amount"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    className="flex-grow px-3 py-2 border border-black text-xs text-[#0a0a0a] focus:outline-none font-mono"
                  />
                  <button
                    id="fund-bounty-submit-btn"
                    type="submit"
                    disabled={isFunding}
                    className="px-5 py-2 bg-[#0a0a0a] text-white text-xs font-mono font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isFunding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add GEN
                  </button>
                </form>
              </div>

              {/* Submissions & Leaderboard */}
              <div className="border-t border-[#e5e5e5] pt-6 space-y-6">
                <h4 className="text-sm font-bold text-[#0a0a0a] flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Submitted Research Reports ({claimInvestigations?.length || 0})
                </h4>

                {/* Winner Callout if resolved */}
                {getWinnerReport() && (
                  <div className="border border-[#16a34a] bg-[#16a34a]/5 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#16a34a] uppercase flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Highest Scored Winning Report
                      </span>
                      <span className="text-xs font-mono font-bold text-[#16a34a]">
                        AI SCORE: {getWinnerReport()?.ai_score}/100
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-mono text-[#0a0a0a]">
                        Researcher: <span className="font-bold">@{getWinnerReport(selectedClaim)?.username || "Anonymous"}</span> ({getWinnerReport(selectedClaim)?.submittedBy})
                      </p>
                      <p className="text-xs text-[#6b7280] italic leading-relaxed">
                        "{selectedClaim?.explanation}"
                      </p>

                      {getWinnerReport()?.ai_feedback && (
                        <div className="mt-2 pt-2 border-t border-[#e5e5e5] text-[11px] text-amber-800 font-mono">
                          <span className="font-bold">AI Feedback: </span>
                          {getWinnerReport()?.ai_feedback}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submissions list */}
                <div className="space-y-4">
                  {claimInvestigations && claimInvestigations.length > 0 ? (
                    claimInvestigations
                      .filter(sub => sub.inv_id !== getWinnerReport()?.inv_id)
                      .map((sub) => (
                        <div key={sub.inv_id} className="border border-[#e5e5e5] p-4 space-y-3 bg-[#fafafa]">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-[#0a0a0a] block">
                                @{sub?.username || "Anonymous"}
                              </span>
                              <span className="text-[10px] font-mono text-[#6b7280]">
                                Address: {sub.investigator.slice(0, 8)}...{sub.investigator.slice(-6)}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold bg-[#f3f3f3] text-[#0a0a0a] px-2.5 py-1">
                              AI SCORE: {sub.ai_score}/100
                            </span>
                          </div>

                          <p className="text-xs text-[#6b7280] leading-relaxed">
                            {sub.ai_feedback}
                          </p>

                          {sub.evidence_urls && sub.evidence_urls.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-mono text-[#6b7280] block uppercase tracking-wider">Citations:</span>
                              <div className="flex flex-wrap gap-2">
                                {sub.evidence_urls.map((url, uidx) => (
                                  <a
                                    key={uidx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-black hover:underline font-mono bg-white border border-[#e5e5e5] px-2 py-0.5"
                                  >
                                    Source #{uidx + 1}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {sub.ai_feedback && (
                            <div className="text-[11px] font-mono text-[#6b7280] bg-white border border-dashed border-[#e5e5e5] p-2.5">
                              <span className="font-bold text-[#0a0a0a]">AI Review:</span> {sub.ai_feedback}
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    !getWinnerReport() && (
                      <p className="text-xs font-mono text-[#6b7280] italic">
                        No research reports have been submitted for this bounty yet.
                      </p>
                    )
                  )}
                </div>
              </div>

              {/* Submit Report Form */}
              {selectedClaim.status === "pending" || selectedClaim.status === "investigating" ? (
                <div className="border-t border-[#e5e5e5] pt-6 space-y-4">
                  <h4 className="text-sm font-bold text-[#0a0a0a] flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Your Investigation Report
                  </h4>
                  <p className="text-xs text-[#6b7280]">
                    Submit evidence and reasoning to compete for the {selectedClaim.bounty_pool?.toLocaleString()} GEN bounty. On-chain AI algorithms analyze and score reports.
                  </p>

                  <form onSubmit={(e) => handleSubmitReport(e, selectedClaim.claim_id)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-[#6b7280] block uppercase tracking-wider">
                        Detailed Explanation
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Explain your findings, evidence details, and structural facts..."
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        className="w-full px-3 py-2 border border-black text-xs text-[#0a0a0a] focus:outline-none font-mono placeholder-[#6b7280]"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-mono text-[#6b7280] block uppercase tracking-wider">
                        Evidence / Source Citations
                      </label>
                      {sourceUrls.map((url, idx) => (
                        <input
                          key={idx}
                          type="url"
                          placeholder="https://example.com/evidence-data"
                          value={url}
                          onChange={(e) => handleSourceUrlChange(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-black text-xs text-[#0a0a0a] focus:outline-none font-mono"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={handleAddSourceField}
                        className="px-3 py-1 border border-black border-dashed text-black hover:bg-[#f9f9f9] font-mono text-[10px] font-bold"
                      >
                        + Add Another Citation
                      </button>
                    </div>

                    <div className="pt-2">
                      {isConnected ? (
                        <button
                          id="submit-research-btn"
                          type="submit"
                          disabled={isSubmittingReport}
                          className="w-full sm:w-auto px-6 py-2.5 bg-black text-white font-mono text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmittingReport ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Running On-Chain AI Evaluation...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Submit Report for AI Scoring
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onConnectClick}
                          className="w-full px-6 py-2.5 border border-black font-mono text-xs font-bold text-[#0a0a0a] hover:bg-[#f3f3f3]"
                        >
                          Connect Wallet to Submit Report
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                <div className="border-t border-[#e5e5e5] pt-6 text-center">
                  <div className="inline-block border border-black bg-[#fafafa] px-6 py-4 space-y-1">
                    <h5 className="text-xs font-mono font-bold text-black uppercase">Consensus Reconciled</h5>
                    <p className="text-[11px] text-[#6b7280]">
                      The on-chain contract resolved this claim. Bounties have been distributed to the top investigator.
                    </p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="border border-[#e5e5e5] bg-[#fafafa] py-32 text-center flex flex-col items-center justify-center space-y-4 px-6 h-full">
              <Award className="w-12 h-12 text-[#9ca3af]" />
              <div className="space-y-1">
                <p className="text-sm font-mono font-bold text-[#0a0a0a]">No Bounty Selected</p>
                <p className="text-xs text-[#6b7280] max-w-sm">
                  Select an active bounty from the list on the left to view investigative reports, fund pools, or submit evidence.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
