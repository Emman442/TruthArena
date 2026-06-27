import React, { useState, useEffect } from "react";
import { Copy, Check, ArrowRight } from "lucide-react";
import { Claim, UserProfile } from "../types";
import { useFetchClaims, useUserProfile } from "../hooks/TruthArena";

interface ProfilePageProps {
  isConnected: boolean;
  walletAddress: string;
  onNavigate: (path: string) => void;
  addToast: (msg: string, type: "success" | "error") => void;
}

export default function ProfilePage({
  isConnected,
  walletAddress,
  onNavigate,
  addToast
}: ProfilePageProps) {
  const [copied, setCopied] = useState(false);
  const {isPending: isFetchingProfile, data:profile} = useUserProfile(walletAddress)
  const {isPending: isFetchingClaims, data: claims} = useFetchClaims()
  // Registration interactive state
  const [showRegisterInput, setShowRegisterInput] = useState(false);


  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    addToast("Address copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };


  // Filter claims submitted by this wallet
  const userClaims = claims?.filter(
    (c) => c.submitter.toLowerCase() === walletAddress.toLowerCase()
  );

  const getVerdictStyle = (status: string) => {
    if (status === "Pending" || status === "Investigating") {
      return "bg-[#f3f3f3] text-[#6b7280]";
    }

    switch (status) {
      case "Verified":
        return "bg-[#16a34a] text-white";
      case "False":
        return "bg-[#dc2626] text-white";
      case "Misleading":
        return "bg-[#d97706] text-white";
      case "Unverified":
        return "bg-[#6b7280] text-white";
      default:
        return "bg-[#6b7280] text-white";
    }
  };

  if (isFetchingProfile || !profile) {
    return (
      <div id="profile-loading" className="py-16 text-center text-sm font-mono text-[#6b7280]">
        Loading profile details...
      </div>
    );
  }

  return (
    <div id="profile-page-container" className="py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto space-y-12">
      
      {/* Page Title */}
      <h2 id="profile-title" className="text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
        Your Profile
      </h2>

      {/* Section 1 — Account */}
      <section id="profile-account-section" className="border border-black bg-white p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#6b7280] pb-2 border-b border-[#e5e5e5]">
          Account Details
        </h3>

        <div className="space-y-4">
          {/* Monospace Copyable Wallet */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-[#6b7280] block uppercase tracking-wider">
              Connected Address
            </span>
            <div className="flex items-center gap-2 bg-[#f9f9f9] border border-[#e5e5e5] px-4 py-3 font-mono text-xs sm:text-sm text-[#0a0a0a] justify-between break-all">
              <span>{walletAddress}</span>
              <button
                id="profile-copy-address"
                onClick={handleCopy}
                className="p-1.5 hover:bg-[#e5e5e5] text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
                title="Copy full address"
              >
                {copied ? <Check className="w-4 h-4 text-[#16a34a]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Username */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-[#6b7280] block uppercase tracking-wider">
                Username
              </span>
              {profile.username ? (
                <div className="font-sans font-bold text-lg text-[#0a0a0a]">
                  @{profile.username}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-sans text-sm text-[#6b7280] italic">Not registered</span>
                  {!showRegisterInput && (
                    <button
                      id="show-register-input-btn"
                      onClick={() => setShowRegisterInput(true)}
                      className="px-3 py-1 border border-black text-[#0a0a0a] bg-transparent font-mono text-[10px] font-bold hover:bg-[#f3f3f3]"
                    >
                      Register
                    </button>
                  )}
                </div>
              )}

              {/* Collapsible Register Input */}
              {showRegisterInput && (
                <form id="register-username-form" onSubmit={handleRegister} className="flex gap-2 pt-1.5 max-w-sm">
                  <input
                    id="register-username-input"
                    type="text"
                    required
                    pattern="^[a-zA-Z0-9_]{3,15}$"
                    placeholder="letters, numbers, _ (3-15 chars)"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="flex-grow px-3 py-1.5 border border-black text-xs text-[#0a0a0a] focus:outline-none font-mono"
                  />
                  <button
                    id="submit-register-btn"
                    type="submit"
                    disabled={isRegistering}
                    className="px-4 py-1.5 bg-[#0a0a0a] text-white text-xs font-mono font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {isRegistering ? "Saving..." : "Save"}
                  </button>
                </form>
              )}
            </div>

            {/* Reputation & Dates */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#e5e5e5]">
                <span className="text-[#6b7280] uppercase tracking-wider">Total Earned:</span>
                <span className="font-bold text-[#0a0a0a] text-sm">{profile.total_earned_gen} GEN PTS</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e5e5e5]">
                <span className="text-[#6b7280] uppercase tracking-wider">Registered on GenLayer:</span>
                <span className="font-bold text-[#0a0a0a]">
                  {profile.joined_at ? new Date(profile.joined_at).toLocaleDateString() : "Just now"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — Your Claims */}
      <section id="profile-claims-section" className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-[#0a0a0a]">
          Your Submitted Claims
        </h3>

        {userClaims.length > 0 ? (
          <div id="profile-claims-list" className="flex flex-col border border-[#e5e5e5] bg-white divide-y divide-[#e5e5e5]">
            {userClaims.map((claim) => (
              <button
                key={claim.id}
                id={`user-claim-row-${claim.id}`}
                onClick={() => onNavigate(`claims/${claim.claim_id}`)}
                className="w-full flex flex-col sm:flex-row sm:items-center text-left py-4 px-4 hover:bg-[#f3f3f3] transition-colors gap-3 sm:gap-6"
              >
                {/* Badge Column */}
                <div className="sm:w-36 flex-shrink-0">
                  <span
                    id={`user-claim-badge-${claim.id}`}
                    className={`inline-block px-3 py-1 font-mono text-xs font-bold uppercase text-center w-full sm:w-auto tracking-tight ${getVerdictStyle(
                      claim.status
                    )}`}
                  >
                    {claim.status === "Pending" || claim.status === "Investigating"
                      ? "Awaiting Verdict"
                      : claim.status}
                  </span>
                </div>

                {/* Title */}
                <div className="flex-grow">
                  <h4 className="text-sm font-bold text-[#0a0a0a] line-clamp-1">
                    {claim.title}
                  </h4>
                  <span className="text-xs font-mono text-[#6b7280]">
                    {claim.category} • Submitted {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 flex justify-end">
                  <ArrowRight className="w-4 h-4 text-[#0a0a0a]" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div id="profile-empty-claims" className="text-center py-16 border border-dashed border-[#e5e5e5] bg-[#f9f9f9]">
            <p className="text-sm font-mono text-[#6b7280] mb-4">No claims submitted yet from this address.</p>
            <button
              id="profile-create-first-claim"
              onClick={() => onNavigate("submit")}
              className="px-6 py-2 bg-[#0a0a0a] text-white font-mono text-xs font-bold hover:opacity-95"
            >
              Submit Your First Claim
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
