import { ArrowRight } from "lucide-react";
import { Claim } from "../types";
import { useFetchClaims } from "../hooks/TruthArena";

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  // Get recent verdicts (resolved claims)
  const {isPending: isFetchingClaims, data: claims} = useFetchClaims()
  const resolvedClaims = claims?.filter((c) => ["verified", "false", "misleading", "unverified"].includes(c.status))
    .slice(0, 5);

  const getVerdictStyle = (status: string) => {
    switch (status) {
      case "Verified":
        return "bg-[#16a34a] text-white";
      case "False":
        return "bg-[#dc2626] text-white";
      case "Misleading":
        return "bg-[#d97706] text-white";
      case "Unverified":
        return "bg-[#6b7280] text-white";
      case "Pending":
        return "bg-[#2563eb] text-white";
      case "Investigating":
        return "bg-[#7c3aed] text-white";
      default:
        return "bg-[#6b7280] text-white";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(elapsed / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  };

  return (
    <div id="landing-container" className="py-12 sm:py-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-24">
      {/* 1. HERO SECTION */}
      <section id="hero-section" className="text-center max-w-3xl mx-auto space-y-6">
        <h1 id="hero-headline" className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0a0a0a]">
          Public Claims. AI Verdicts. On-Chain Truth.
        </h1>
        <p id="hero-subheadline" className="text-base sm:text-lg text-[#6b7280] leading-relaxed max-w-2xl mx-auto">
          TruthArena lets anyone submit a public claim. GenLayer AI validators investigate it using live web sources. The verdict is stored permanently on-chain.
        </p>
        <div id="hero-cta-buttons" className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            id="hero-btn-explore"
            onClick={() => onNavigate("claims")}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#0a0a0a] text-white font-mono text-sm font-semibold hover:opacity-95 transition-opacity"
          >
            Explore Claims
          </button>
          <button
            id="hero-btn-submit"
            onClick={() => onNavigate("submit")}
            className="w-full sm:w-auto px-8 py-3.5 border border-black text-[#0a0a0a] bg-transparent font-mono text-sm font-semibold hover:bg-[#f3f3f3] transition-colors"
          >
            Submit a Claim
          </button>
        </div>
      </section>

      {/* 2. ROADMAP SECTION */}
      <section id="roadmap-section" className="space-y-8 border-t border-[#e5e5e5] pt-16">
        <h2 id="roadmap-title" className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
          How TruthArena Evolves
        </h2>
        <div id="roadmap-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1 — Phase 1 */}
          <div id="roadmap-card-phase1" className="border border-black bg-white p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs pb-2 font-mono font-medium uppercase tracking-wider text-[#0a0a0a]">
                   Live Now
                </span>
              <h3 className="text-xl font-bold">FactCheck Arena</h3>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                Submit any public claim. AI validators fetch live web data and reach consensus on whether it is verified, false, misleading, or unverified. Every verdict is stored permanently on GenLayer.
              </p>
              <ul className="space-y-2 pt-2 text-sm text-[#0a0a0a] font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-[#16a34a]">✓</span> Submit claims in any category
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#16a34a]">✓</span> AI validators fetch live evidence
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#16a34a]">✓</span> Multi-model consensus verdict
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#16a34a]">✓</span> Permanent on-chain record
                </li>
              </ul>
            </div>
            <button
              id="roadmap-btn-phase1"
              onClick={() => onNavigate("claims")}
              className="mt-8 w-full py-3 bg-[#0a0a0a] text-white font-mono text-xs font-bold hover:opacity-95 transition-opacity"
            >
              Start Fact-Checking
            </button>
          </div>

          {/* Card 2 — Phase 2 */}
           <div  id="roadmap-card-phase1" className="border border-black bg-white p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#0a0a0a]">
                   Live Now
                </span>
                
              </div>
              <h3 className="text-xl font-bold text-[#0a0a0a]">Truth Markets</h3>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                Stake GEN tokens on whether you believe a claim is true or false. AI investigators determine the outcome. Evidence-based consensus resolves the market and pays out to the correct side.
              </p>
              <ul className="space-y-2 pt-2 text-sm text-[#0a0a0a] font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-[#16a34a]">✓</span> Support or challenge any claim
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#16a34a]">✓</span> Stake GEN on your position
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#16a34a]">✓</span> AI-determined resolution
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#16a34a]">✓</span> Proportional payouts to winners
                </li>
              </ul>
            </div>
            <button
              id="roadmap-btn-phase3"
              onClick={() => onNavigate("markets")}
              className="mt-8 w-full py-3 bg-[#0a0a0a] text-white font-mono text-xs font-bold cursor-pointer hover:opacity-95 transition-opacity"
            >
              Explore Truth Markets
            </button>
          </div>
          <div id="roadmap-card-phase2" className="border border-[#e5e5e5] bg-white p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#6b7280]">
                  Phase 2 — Coming Soon
                </span>
                <span className="text-[10px] bg-[#f3f3f3] text-[#6b7280] px-1.5 py-0.5 rounded-full font-mono">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#6b7280]">Investigation Bounties</h3>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                Attach GEN token rewards to claims. Researchers compete to submit the strongest investigation report. AI scores each submission and the best investigator wins the bounty.
              </p>
              <ul className="space-y-2 pt-2 text-sm text-[#6b7280] font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-[#6b7280]">•</span> Fund investigations with GEN
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#6b7280]">•</span> Submit research and evidence URLs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#6b7280]">•</span> AI scores investigation quality
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#6b7280]">•</span> Winners earn bounty rewards
                </li>
              </ul>
            </div>
            <button
              id="roadmap-btn-phase2"
              disabled
              onClick={() => onNavigate("bounties")}
              className="mt-8 w-full py-3 bg-[#f3f3f3] text-[#6b7280] font-mono text-xs font-bold cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          
        
        </div>
      </section>

     
      <section id="recent-verdicts-section" className="space-y-6 border-t border-[#e5e5e5] pt-16">
        <div className="flex items-center justify-between">
          <h2 id="recent-verdicts-title" className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
            Recent Verdicts
          </h2>
          <button
            id="view-all-verdicts"
            onClick={() => onNavigate("claims")}
            className="text-sm font-mono font-bold text-[#0a0a0a] hover:underline flex items-center gap-1.5"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {resolvedClaims?.length > 0 ? (
          <div id="verdicts-table" className="divide-y divide-[#e5e5e5] border-y border-[#e5e5e5]">
            {resolvedClaims.map((claim) => (
              <button
                key={claim.claim_id}
                id={`verdict-row-${claim.claim_id}`}
                onClick={() => onNavigate(`claims/${claim.claim_id}`)}
                className="w-full flex flex-col md:flex-row md:items-center text-left py-4 px-2 hover:bg-[#f3f3f3] transition-colors gap-3 md:gap-6"
              >
                {/* Badge Column */}
                <div className="md:w-32 flex-shrink-0">
                  <span
                    id={`verdict-badge-${claim.claim_id}`}
                    className={`inline-block px-3 py-1 font-mono text-xs font-bold tracking-tight text-center uppercase ${getVerdictStyle(
                      claim.status
                    )}`}
                  >
                    {claim.status}
                  </span>
                </div>

                {/* Claim Title */}
                <div className="flex-grow">
                  <h4 className="text-sm font-bold text-[#0a0a0a] line-clamp-1">
                    {claim.title}
                  </h4>
                </div>

                {/* Metadata Column */}
                <div className="md:w-48 flex-shrink-0 flex items-center justify-between md:justify-end gap-4 text-xs font-mono text-[#6b7280]">
                  <span>{claim.category}</span>
                  <span>{formatTimeAgo(claim.submitted_at)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p id="no-verdicts-message" className="text-sm text-[#6b7280] py-8 text-center border border-dashed border-[#e5e5e5]">
            No resolved verdicts in this cycle yet. AI validators are hard at work.
          </p>
        )}
      </section>
    </div>
  );
}
