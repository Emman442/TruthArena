import { useState } from "react";
import { Copy, Check, ExternalLink, ShieldCheck, HelpCircle, Clock } from "lucide-react";
import { Claim } from "../types";
import { useFetchClaimPositions, useFetchFactCheckResult, useInvestigateClaim, useOpenTruthMarket, useResolveTruthMarket } from "../hooks/TruthArena";
import { SelectContent, SelectTrigger, SelectValue, SelectItem, Select } from "./Select";
import { Label } from "./Label";

interface ClaimDetailPageProps {
  addToast: (message: string, type?: "success" | "error") => void;
  claim: Claim;
  onNavigate: (path: string) => void;
  walletAddress?: string | null;
}

export default function ClaimDetailPage({
  addToast,
  claim,
  onNavigate,
  walletAddress
}: ClaimDetailPageProps) {
  const [copied, setCopied] = useState(false);
  const [deadlineSeconds, setDeadlineSeconds] = useState(0);
  const { isPending: isInvestigatingClaim, mutate: investigateClaim } = useInvestigateClaim()
  const { isPending: isFetchingResults, data: FactCheckResults } = useFetchFactCheckResult(claim.claim_id)
  const { isPending: isOpeningMarket, mutate: openMarket } = useOpenTruthMarket()

  const { isPending: isResolvingMarket, mutate: resolveMarket } = useResolveTruthMarket();
    const { data: claimPositions } = useFetchClaimPositions(claim.claim_id);
  const handleCopy = () => {
    navigator.clipboard.writeText(claim.submitter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvestigateClaim = () => {
    investigateClaim({ claim_id: claim.claim_id }, { onSuccess: () => { addToast("Claim investigation initiated.", "success") }, onError: () => { addToast("Failed to initiate claim investigation.", "error") } })
  }

  const handleOpenMarket = () => {
    if (!deadlineSeconds || deadlineSeconds <= 0) {
      addToast("Please select a valid challenge duration before opening the market.", "error");
      return;
    }

    openMarket({ claim_id: claim.claim_id, deadline_seconds: deadlineSeconds }, { onSuccess: () => { addToast("Truth market opened successfully!", "success") }, onError: () => { addToast("Failed to open truth market.", "error") } })

  }

  const isOwner = walletAddress?.toLowerCase() === claim.submitter.toLowerCase();
  const currentUnixTime = Math.floor(Date.now());
  const isMarketActive = claim.market_deadline ? currentUnixTime < claim.market_deadline : false;
  const isTriggerDisabled = isInvestigatingClaim || isMarketActive;

  const DURATIONS = {
    "1h": 3600,
    "6h": 21600,
    "12h": 43200,
    "24h": 86400,
    "3d": 259200,
    "7d": 604800,
  };

  const getVerdictStyle = (status: string) => {
    switch (status) {
      case "verified":
        return {
          banner: "bg-[#16a34a] text-white",
          text: "text-[#16a34a]",
          border: "border-[#16a34a]"
        };
      case "false":
        return {
          banner: "bg-[#dc2626] text-white",
          text: "text-[#dc2626]",
          border: "border-[#dc2626]"
        };
      case "misleading":
        return {
          banner: "bg-[#d97706] text-white",
          text: "text-[#d97706]",
          border: "border-[#d97706]"
        };
      case "unverified":
        return {
          banner: "bg-[#6b7280] text-white",
          text: "text-[#6b7280]",
          border: "border-[#6b7280]"
        };
      case "pending":
        return {
          banner: "bg-[#2563eb] text-white",
          text: "text-[#2563eb]",
          border: "border-[#2563eb]"
        };
      case "investigating":
        return {
          banner: "bg-[#7c3aed] text-white",
          text: "text-[#7c3aed]",
          border: "border-[#7c3aed]"
        };
      default:
        return {
          banner: "bg-[#6b7280] text-white",
          text: "text-[#6b7280]",
          border: "border-[#6b7280]"
        };
    }
  };

  const styles = getVerdictStyle(claim.status);
  const isResolved = ["verified", "false", "misleading", "unverified"].includes(claim.status);

  return (
    <div id="claim-detail-container" className="py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div id="breadcrumb" className="text-xs sm:text-sm font-mono text-[#6b7280] flex items-center gap-1.5">
        <button id="breadcrumb-claims-link" onClick={() => onNavigate("claims")} className="hover:text-[#0a0a0a] hover:underline">
          Claims
        </button>
        <span>/</span>
        <span id="breadcrumb-current-title" className="text-[#0a0a0a] font-semibold truncate max-w-xs sm:max-w-md">
          {claim.title}
        </span>
      </div>

      <div id="detail-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">


        <div id="left-column" className="lg:col-span-8 space-y-8">

          <div id="status-verdict-banner" className={`w-full p-4 font-mono ${styles.banner}`}>
            {isResolved ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div>
                  <span className="font-bold text-lg tracking-wider mr-3">VERDICT: {claim.status.toUpperCase()}</span>
                  <span className="opacity-80">| Confidence: {FactCheckResults?.confidence}</span>
                </div>
                <div className="text-xs opacity-90 sm:text-right">
                  Resolved: {claim.resolved_at ? new Date(claim.resolved_at).toLocaleDateString() : ""}
                </div>
              </div>
            ) : claim.status === "investigating" ? (
              <div className="flex items-center gap-3 text-sm font-bold">
                <span className="animate-pulse bg-white/20 px-2 py-1 text-xs">ON-CHAIN INVESTIGATION RUNNING</span>
                <span>AI validators are currently investigating this claim</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm font-bold">
                <span className="bg-white/20 px-2 py-1 text-xs">PENDING</span>
                <span>This claim is awaiting AI investigation</span>
              </div>
            )}
          </div>

          <div id="claim-text-block" className="space-y-3">
            <span id="label-claim" className="text-[11px] font-mono text-[#6b7280] uppercase tracking-wider font-bold block">
              Claim
            </span>
            <h1 id="claim-text-display" className="text-xl sm:text-2xl font-bold text-[#0a0a0a] leading-relaxed">
              {claim.claim_text}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#6b7280] pt-2">
              <span className="border border-[#e5e5e5] px-2.5 py-1 text-[#0a0a0a] font-medium bg-[#f9f9f9]">
                {claim.category}
              </span>
              <span>•</span>
              <span>Submitted: {new Date(claim.submitted_at).toLocaleDateString()}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span>By:</span>
                <span className="font-semibold text-[#0a0a0a]">
                  {claim.submitter.slice(0, 6)}...{claim.submitter.slice(-4)}
                </span>
                <button
                  id="copy-address-btn"
                  onClick={handleCopy}
                  className="p-1 hover:bg-[#f3f3f3] text-[#6b7280] hover:text-[#0a0a0a] transition-colors rounded-xs"
                  title="Copy Wallet Address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16a34a]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submitter-provided Sources */}
          <div id="submitted-sources-block" className="space-y-3 pt-4 border-t border-[#e5e5e5]">
            <span id="label-submitted-sources" className="text-[11px] font-mono text-[#6b7280] uppercase tracking-wider font-bold block">
              Submitted Sources
            </span>
            {claim.source_urls && claim.source_urls.length > 0 ? (
              <ul id="submitted-sources-list" className="space-y-2 font-mono text-xs text-[#0a0a0a]">
                {claim.source_urls.map((url, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-[#6b7280]" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-[#6b7280] break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p id="no-submitted-sources" className="text-sm font-mono text-[#6b7280] italic">
                No sources provided by submitter
              </p>
            )}
          </div>

          {isResolved && FactCheckResults && (
            <div id="ai-verdict-reasoning-block" className="space-y-6 pt-6 border-t border-[#e5e5e5]">
              <div className="space-y-3">
                <span id="label-verdict-reasoning" className="text-[11px] font-mono text-[#6b7280] uppercase tracking-wider font-bold block">
                  AI Verdict Reasoning
                </span>
                <div id="verdict-reasoning-prose" className="text-sm sm:text-base text-[#0a0a0a] leading-relaxed space-y-4 font-sans font-normal whitespace-pre-wrap">
                  {FactCheckResults.reasoning}
                </div>
              </div>

              {/* Sources checked by validators */}
              <div className="space-y-3 pt-4 border-t border-[#e5e5e5]">
                <span id="label-checked-sources" className="text-[11px] font-mono text-[#6b7280] uppercase tracking-wider font-bold block">
                  Sources Checked by Validators
                </span>
                {FactCheckResults.sources_checked && FactCheckResults.sources_checked.length > 0 ? (
                  <ul id="checked-sources-list" className="space-y-2 font-mono text-xs text-[#0a0a0a]">
                    {FactCheckResults.sources_checked.map((url, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#16a34a]" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-[#6b7280] break-all"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p id="no-checked-sources" className="text-sm font-mono text-[#6b7280] italic">
                    No validation sources logged.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div id="right-column" className="lg:col-span-4 lg:sticky lg:top-[74px] space-y-6">

          <div id="status-card" className="border border-black p-5 bg-white space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6b7280] pb-2 border-b border-[#e5e5e5]">
              Status Card
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-xs font-mono">
              <span className="text-[#6b7280]">Current Status:</span>
              <span className={`font-bold uppercase text-right ${styles.text}`}>{claim.status}</span>

              <span className="text-[#6b7280]">Submitted:</span>
              <span className="font-bold text-[#0a0a0a] text-right">
                {new Date(claim.submitted_at).toLocaleDateString()}
              </span>

              {isResolved && (
                <>
                  <span className="text-[#6b7280]">Resolved:</span>
                  <span className="font-bold text-[#0a0a0a] text-right">
                    {claim.resolved_at ? new Date(claim.resolved_at).toLocaleDateString() : "--"}
                  </span>
                </>
              )}

              <span className="text-[#6b7280]">Category:</span>
              <span className="font-bold text-[#0a0a0a] text-right">{claim.category}</span>
            </div>

            {/* Trigger Investigation Trigger */}
            {claim.status === "pending" && (
              <div className="pt-2 border-t border-[#e5e5e5] space-y-3">
                <button
                  id="trigger-investigation-btn"
                  onClick={handleInvestigateClaim}
                  disabled={isTriggerDisabled}
                  className="w-full py-3 bg-[#0a0a0a] text-white font-mono text-xs font-bold hover:opacity-95 transition-opacity disabled:opacity-50"
                >
                  {isInvestigatingClaim ? "Submitting to GenLayer..." : "Trigger Investigation"}
                </button>
                {isInvestigatingClaim && (
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#7c3aed]">
                    <div className="w-3 h-3 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting Transaction. Waiting for GenLayer confirmation...</span>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* <div id="bounty-panel" className="border border-black p-5 bg-white text-[#0a0a0a] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6b7280]">
                Investigation Bounty
              </h4>
              <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider">Active</span>
            </div>

            <p className="text-xs text-[#6b7280]">
              Fund researchers to investigate this claim by placing a custom bounty.
            </p>

            {isOwner ? (
              <form onSubmit={handleFundBounty} className="flex gap-2">
                <input
                  id="claim-bounty-input"
                  type="number"
                  min="1"
                  placeholder="0.0 GEN"
                  className="w-full px-3 py-1.5 border border-black bg-white text-xs font-mono focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#0a0a0a] text-white font-mono text-xs font-bold"
                >
                  Add
                </button>
              </form>
            ) : (
              <div className="text-[11px] font-mono text-[#6b7280] bg-[#fafafa] p-2.5 border border-dashed border-[#e5e5e5] text-center">
                Bounty management reserved for claim author.
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate("bounties")}
              className="w-full py-2 bg-[#fafafa] border border-black text-[#0a0a0a] font-mono text-xs font-bold hover:bg-[#f3f3f3] transition-colors"
            >
              Go to Bounty Dashboard
            </button>
          </div> */}




          {!isResolved ? (
            <div id="markets-panel" className="border border-black p-5 bg-white text-[#0a0a0a] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6b7280]">
                  Truth Market
                </h4>
                <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider">
                  {claim.market_status === "open" ? "Live Pools" : "Inactive"}
                </span>
              </div>

              <p className="text-xs text-[#6b7280] leading-relaxed">
                Truth Markets allow you to stake GEN tokens on a claim's final resolution...
              </p>

              {claim.market_status === "open" ? (
                /* Case 1: Market is already open -> Show Resolve Status Actions */
                <div className="space-y-3">
                  <div className="w-full py-2.5 bg-[#f3f3f3] border border-[#e5e5e5] text-[#6b7280] font-mono text-xs font-bold text-center flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    TRUTH MARKET IS OPEN
                  </div>

                  {/* Resolve Action Button Block */}
                  {(() => {
                    const currentUnixSeconds = Math.floor(Date.now() );
                    const deadlineReached = claim.market_deadline ? currentUnixSeconds >= claim.market_deadline : false;

                    const handleResolveMarket = () => {
                      resolveMarket(
                        { claim_id: claim.claim_id },
                        {
                          onSuccess: () => addToast("Truth market resolved successfully!", "success"),
                          onError: () => addToast("Failed to resolve truth market.", "error")
                        }
                      );
                    };

                    return (
                      <div className="space-y-1.5">
                        <button
                          id="resolve-truth-market-btn"
                          disabled={!deadlineReached || isResolvingMarket || claimPositions?.length === 0}
                          onClick={handleResolveMarket}
                          className="w-full py-2.5 bg-[#7c3aed] cursor-pointer text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:hover:opacity-100 disabled:cursor-not-allowed"
                        >
                          {isResolvingMarket ? "Resolving Market Pool..." : "Resolve Truth Market"}
                        </button>

                        {!deadlineReached && claim.market_deadline && (
                          <p className="text-[10px] font-mono text-amber-600 text-center flex items-center justify-center gap-1">
                             Locked until: {new Date(claim.market_deadline).toLocaleString()}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : !isOwner ? (
                <div className="w-full p-3 bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[11px] text-center">
                  ⚠️ Only the claim creator can initialize this market pool.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" /> Challenge Duration
                    </Label>
                    <Select
                      value={deadlineSeconds.toString()}
                      defaultValue='84600'
                      onValueChange={(value) => setDeadlineSeconds(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>

                      <SelectContent>
                        {Object.entries(DURATIONS).map(([label, value]) => (
                          <SelectItem key={value} value={value.toString()}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    id="open-truth-market-btn"
                    disabled={isOpeningMarket}
                    onClick={handleOpenMarket}
                    className="w-full py-2.5 bg-[#0a0a0a] text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    {isOpeningMarket ? "Opening Truth Market..." : "Open Truth Market"}
                  </button>
                </>
              )}
            </div>
          ) : ""}

        </div>
      </div>
    </div>
  );
}
