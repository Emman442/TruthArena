import React, { useState } from "react";
import { TrendingUp, Shield, ArrowUpRight, CheckCircle, Gift, RefreshCw, XCircle, AlertCircle } from "lucide-react";
import { Claim } from "../types";
import { useFetchClaimPositions, useFetchClaims, usePlaceBet } from "../hooks/TruthArena";
import { getAddress } from "viem";

interface MarketsPageProps {
  claims: Claim[];
  isConnected: boolean;
  walletAddress: string;
  onConnectClick: () => void;
  onNavigate: (path: string) => void;
  fetchClaims: () => void;
  addToast: (msg: string, type: "success" | "error") => void;
}

export default function MarketsPage({
  isConnected,
  walletAddress: LowerCaseAddress,
  onConnectClick,
  addToast
}: MarketsPageProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const { data: claims } = useFetchClaims();
  const { data: claimPositions } = useFetchClaimPositions(selectedClaimId || "");
  const walletAddress = LowerCaseAddress ? getAddress(LowerCaseAddress) : "";
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakePrediction, setStakePrediction] = useState<'support' | 'challenge'>('support');
  const { isPending: isPlacingBet, mutate: placeBet } = usePlaceBet();
  const selectedClaim = claims?.find((c) => c.claim_id === selectedClaimId);
  const activeMarkets = claims?.filter(c => c.market_status === "open" && Date.now() < (c.market_deadline || 0));
  const resolvedMarkets = claims?.filter(c => c.market_status === "resolved" || c.status === "resolved" || Date.now() >= (c.market_deadline || 0));
  const getMarketStats = (claim: Claim) => {
    const sPool = claim?.support_pool || 0;
    const cPool = claim?.challenge_pool || 0;
    const total = sPool + cPool;
    const sPct = total === 0 ? 50 : Math.round((sPool / total) * 100);
    const cPct = total === 0 ? 50 : 100 - sPct;
    const userStakes = claimPositions?.filter(
      s => walletAddress && s.participant?.toLowerCase() === walletAddress.toLowerCase()
    ) || [];
    let outcomeLabel = "Pending Consensus";
    if (claim.market_status === "resolved") {
      if (claim.market_outcome === "verified") outcomeLabel = "Verified (Support Wins)";
      else if (claim.market_outcome === "false") outcomeLabel = "False (Challenge Wins)";
      else outcomeLabel = `Resolved as ${claim.market_outcome?.toUpperCase()}`;
    }

    return {
      sPool,
      cPool,
      total,
      sPct,
      cPct,
      userStakes,
      outcomeLabel
    };
  };

  const handlePlaceStake = async (e: React.FormEvent, claimId: string) => {
    e.preventDefault();
    const amount = parseInt(stakeAmount);
    if (!selectedClaim || !selectedClaimId) return;

    if (isNaN(amount) || amount <= 0) {
      addToast("Please enter a valid positive GEN amount to stake.", "error");
      return;
    }

    if (!isConnected) {
      onConnectClick();
      return;
    }

    placeBet({
      claim_id: selectedClaimId,
      position: stakePrediction,
      stake_amount: amount
    }, {
      onSuccess: () => {
        addToast("Bet Placed Successfully", "success");
        setStakeAmount("");
      },
      onError: () => {
        addToast("Failed to place bet", "error");
      }
    });
  };

  return (
    <div id="markets-page-container" className="py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-12">

      {/* Page Header */}
      <div id="markets-header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-[#e5e5e5]">
        <div className="space-y-2">
          <h2 id="markets-title" className="text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
            Truth Markets
          </h2>
          <p id="markets-subtitle" className="text-sm text-[#6b7280]">
            Stake your GEN tokens on whether you believe claims will resolve as verified or false. Win payouts based on collective consensus accuracy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column: List of Market Pools */}
        <div className="lg:col-span-1 space-y-8">

          {/* Active Markets Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#0a0a0a] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Active Truth Markets
            </h3>

            <div id="active-markets-list" className="space-y-4">
              {activeMarkets && activeMarkets.length > 0 ? (
                activeMarkets.map((claim) => {
                  const isActive = claim.claim_id === selectedClaimId;
                  const stats = getMarketStats(claim);

                  return (
                    <button
                      key={claim.claim_id}
                      id={`market-card-${claim.claim_id}`}
                      onClick={() => setSelectedClaimId(claim.claim_id)}
                      className={`w-full text-left p-5 border transition-all ${isActive
                        ? "border-black bg-[#fdfdfd] ring-1 ring-black shadow-xs"
                        : "border-[#e5e5e5] bg-white hover:border-black"
                        }`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <span className="text-[10px] bg-[#f3f3f3] text-[#6b7280] px-2 py-0.5 font-mono font-bold uppercase">
                          {claim.category}
                        </span>
                        <span className="font-mono text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 px-1.5 py-0.5">
                          {claim.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#0a0a0a] line-clamp-2 mb-4">
                        {claim.title}
                      </h4>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-[#6b7280]">
                          <span>{stats.sPct}% Support</span>
                          <span>{stats.cPct}% Challenge</span>
                        </div>
                        <div className="w-full h-1.5 flex bg-[#e5e5e5]">
                          <div className="h-full bg-black" style={{ width: `${stats.sPct}%` }} />
                          <div className="h-full bg-[#9ca3af]" style={{ width: `${stats.cPct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#f3f3f3] mt-3 text-[10px] font-mono text-[#6b7280]">
                        <span>Total Staked:</span>
                        <span className="font-bold text-[#0a0a0a]">
                          {stats.total} GEN
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs font-mono text-[#6b7280] italic">No active markets available.</p>
              )}
            </div>
          </div>

          {/* Resolved Markets Section */}
          <div className="space-y-4 pt-4 border-t border-[#e5e5e5]">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#6b7280]">
              Ended & Resolved Markets
            </h3>

            <div id="resolved-markets-list" className="space-y-4">
              {resolvedMarkets && resolvedMarkets.length > 0 ? (
                resolvedMarkets.map((claim) => {
                  const isActive = claim.claim_id === selectedClaimId;
                  const stats = getMarketStats(claim);

                  return (
                    <button
                      key={claim.claim_id}
                      id={`market-card-resolved-${claim.claim_id}`}
                      onClick={() => setSelectedClaimId(claim.claim_id)}
                      className={`w-full text-left p-4 border transition-all ${isActive
                        ? "border-black bg-[#fdfdfd] ring-1 ring-black shadow-xs"
                        : "border-[#e5e5e5] bg-white hover:border-black"
                        }`}
                    >
                      <h4 className="text-xs font-bold text-[#0a0a0a] line-clamp-2 mb-3">
                        {claim.title}
                      </h4>

                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-[#6b7280]">Outcome:</span>
                        <span className={`font-bold uppercase ${claim.market_status === 'resolved' ? 'text-green-600' : 'text-amber-600'}`}>
                          {stats.outcomeLabel}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs font-mono text-[#6b7280] italic">No resolved markets yet.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right columns: Selected Market Dashboard & Interaction panel */}
        <div className="lg:col-span-2">
          {selectedClaim ? (() => {
            const stats = getMarketStats(selectedClaim);
            const isExpired = Date.now() >= (selectedClaim.market_deadline || 0);
            const isMarketActive = selectedClaim.market_status === "open" && !isExpired;
            const isMarketResolved = selectedClaim.market_status === "resolved";

            return (
              <div id="selected-market-panel" className="border border-black bg-white p-6 sm:p-8 space-y-8">

                {/* Claim Details block */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#6b7280]">
                      MARKET ID: {selectedClaim.claim_id}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase ${
                      isMarketActive ? "bg-amber-100 text-amber-800" : isMarketResolved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {isMarketActive ? "Active Betting" : isMarketResolved ? "Market Resolved" : "Awaiting Consensus"}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-[#0a0a0a] leading-tight">
                    {selectedClaim.title}
                  </h3>

                  <p className="text-sm text-[#6b7280] leading-relaxed">
                    {selectedClaim.claim_text}
                  </p>
                </div>

                {/* Pool Ratio Board */}
                <div className="border border-black bg-[#fafafa] p-6 space-y-6">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6b7280]">
                    On-Chain Staking Ratios
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-r border-[#e5e5e5] pr-4">
                      <span className="text-[10px] font-mono text-[#6b7280] block">SUPPORT POOL (TRUE)</span>
                      <span className="text-lg font-bold text-black font-mono">
                        {stats.sPool.toLocaleString()} GEN
                      </span>
                      <span className="text-xs font-mono text-[#6b7280] block mt-1">
                        Odds multiplier: {(stats.cPct === 0 ? 1 : 1 + (stats.cPct / (stats.sPct || 1))).toFixed(2)}x
                      </span>
                    </div>

                    <div className="pl-4">
                      <span className="text-[10px] font-mono text-[#6b7280] block">CHALLENGE POOL (FALSE)</span>
                      <span className="text-lg font-bold text-black font-mono">
                        {stats.cPool.toLocaleString()} GEN
                      </span>
                      <span className="text-xs font-mono text-[#6b7280] block mt-1">
                        Odds multiplier: {(stats.sPct === 0 ? 1 : 1 + (stats.sPct / (stats.cPct || 1))).toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="w-full h-4 flex bg-[#e5e5e5]">
                      <div className="h-full bg-black text-[10px] font-mono font-bold text-white flex items-center justify-center" style={{ width: `${stats.sPct}%` }}>
                        {stats.sPct >= 15 && `${stats.sPct}%`}
                      </div>
                      <div className="h-full bg-[#9ca3af] text-[10px] font-mono font-bold text-white flex items-center justify-center" style={{ width: `${stats.cPct}%` }}>
                        {stats.cPct >= 15 && `${stats.cPct}%`}
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-[#9ca3af]">
                      <span>Verified outcome</span>
                      <span>False/Misleading/Unverified outcome</span>
                    </div>
                  </div>
                </div>

                {/* Verdict Reasoning Board if resolved */}
                {isMarketResolved && selectedClaim.verdict_reasoning && (
                  <div className="p-5 border border-black bg-gray-50 space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-black">
                      <AlertCircle className="w-4 h-4" /> Genlayer Validator Verdict Reasoning
                    </h4>
                    <p className="text-xs text-[#4b5563] leading-relaxed font-mono">
                      {selectedClaim.verdict_reasoning}
                    </p>
                  </div>
                )}

                {/* User Stakes overview with Payouts */}
                <div className="border-t border-[#e5e5e5] pt-6 space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6b7280]">
                    Your Staking Positions & Claims
                  </h4>

                  {stats.userStakes.length > 0 ? (
                    <div className="space-y-2 font-mono text-xs">
                      {stats.userStakes.map((stake: any) => {
                        return (
                          <div key={stake.position_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#fafafa] border border-[#e5e5e5] px-4 py-3 gap-2">
                            <span className="flex items-center gap-1.5 font-bold text-[#0a0a0a]">
                              <Shield className="w-3.5 h-3.5" />
                              Staked on {stake.position === "support" ? "Verified" : "False/Misleading"}
                            </span>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                              <div className="text-right">
                                <span className="text-[#6b7280] block text-[10px]">INITIAL STAKE</span>
                                <span className="font-bold text-[#0a0a0a]">{stake.stake_gen.toLocaleString()} GEN</span>
                              </div>

                              {isMarketResolved && (
                                <div className="text-right border-l border-[#e5e5e5] pl-4">
                                  <span className="text-[#6b7280] block text-[10px]">PAYOUT RESULT</span>
                                  {stake.won ? (
                                    <span className="font-bold text-green-600 flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5 inline" /> +{stake.payout} GEN
                                    </span>
                                  ) : selectedClaim.market_outcome === "unverified" ? (
                                    <span className="font-bold text-amber-600">
                                      Returned: {stake.payout} GEN
                                    </span>
                                  ) : (
                                    <span className="font-bold text-red-600 flex items-center gap-1">
                                      <XCircle className="w-3.5 h-3.5 inline" /> 0 GEN (Lost)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-[#6b7280] italic">
                      You have no staking positions in this market yet.
                    </p>
                  )}
                </div>

                {/* Interactive Action Forms based on Exact State machine */}
                {isMarketActive ? (
                  <div className="border-t border-[#e5e5e5] pt-6 space-y-4">
                    <h4 className="text-sm font-bold text-[#0a0a0a]">
                      Place New Prediction Stake
                    </h4>

                    <form onSubmit={(e) => handlePlaceStake(e, selectedClaim.claim_id)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setStakePrediction('support')}
                          className={`py-3 px-4 border text-xs font-mono font-bold text-center transition-colors ${stakePrediction === 'support'
                            ? "border-black bg-black text-white"
                            : "border-[#e5e5e5] text-black hover:border-black bg-white"
                            }`}
                        >
                          SUPPORT VERIFIED OUTCOME
                        </button>
                        <button
                          type="button"
                          onClick={() => setStakePrediction('challenge')}
                          className={`py-3 px-4 border text-xs font-mono font-bold text-center transition-colors ${stakePrediction === 'challenge'
                            ? "border-black bg-black text-white"
                            : "border-[#e5e5e5] text-black hover:border-black bg-white"
                            }`}
                        >
                          CHALLENGE OUTCOME (FALSE)
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-[#6b7280] block uppercase tracking-wider">
                          Stake Amount (GEN)
                        </label>
                        <div className="flex gap-2 max-w-sm">
                          <input
                            id="stake-amount-input"
                            type="number"
                            required
                            min="10"
                            placeholder="Min 10 GEN"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            className="flex-grow px-3 py-2 border border-black text-xs text-[#0a0a0a] focus:outline-none font-mono"
                          />
                          {isConnected ? (
                            <button
                              id="submit-stake-btn"
                              type="submit"
                              disabled={isPlacingBet}
                              className="px-6 py-2 bg-[#0a0a0a] text-white text-xs font-mono font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isPlacingBet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                              Place Stake
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={onConnectClick}
                              className="px-4 py-2 border border-black font-mono text-xs font-bold text-black hover:bg-[#f3f3f3]"
                            >
                              Connect Wallet
                            </button>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="border-t border-[#e5e5e5] pt-6">
                    <div className={`border p-5 text-center space-y-2 ${isMarketResolved ? "border-green-500 bg-green-50/30" : "border-amber-500 bg-amber-50/40"}`}>
                      <div className={`inline-flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-wider ${isMarketResolved ? "text-green-700" : "text-amber-700"}`}>
                        {isMarketResolved ? <CheckCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
                        {isMarketResolved ? `Market Finalized — Result: ${stats.outcomeLabel}` : "Market Ended — Processing Consensus"}
                      </div>
                      <p className="text-xs text-[#6b7280] max-w-md mx-auto leading-relaxed">
                        {isMarketResolved 
                          ? `This market successfully resolved at ${new Date(selectedClaim.resolved_at!).toLocaleString()}. Payout claims are processed based on your winning stakes.`
                          : `The staking window closed. Staking is now locked while GenLayer validators compute the final consensus.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="border border-[#e5e5e5] bg-[#fafafa] py-32 text-center flex flex-col items-center justify-center space-y-4 px-6 h-full">
              <TrendingUp className="w-12 h-12 text-[#9ca3af]" />
              <div className="space-y-1">
                <p className="text-sm font-mono font-bold text-[#0a0a0a]">No Prediction Market Selected</p>
                <p className="text-xs text-[#6b7280] max-w-sm">
                  Select an active or resolved truth market from the list on the left to view pool volumes, current ratios, or stake your tokens.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}