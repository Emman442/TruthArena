import React, { useState } from "react";

interface BountiesPageProps {
  addToast: (msg: string, type: "success" | "error") => void;
}

export default function BountiesPage({ addToast }: BountiesPageProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      addToast("Please enter a valid email address.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phase: "Phase 2 - Bounties" })
      });

      if (res.ok) {
        setIsSignedUp(true);
        addToast("Successfully signed up for Phase 2 notifications!", "success");
        setEmail("");
      } else {
        addToast("Failed to register. Please try again.", "error");
      }
    } catch (err) {
      addToast("Failed to register. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="bounties-page-container" className="py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Page Header */}
      <div id="bounties-header" className="space-y-2">
        <h2 id="bounties-title" className="text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
          Investigation Bounties
        </h2>
        <p id="bounties-subtitle" className="text-sm text-[#6b7280]">
          Fund deep analytical research with GEN tokens and incentivize independent validation.
        </p>
      </div>

      {/* Top Notice Banner */}
      <div id="bounties-notice-banner" className="border border-black p-6 bg-white space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-[#0a0a0a]">
            Phase 2: Investigation Bounties is Coming Soon
          </h4>
          <p className="text-xs text-[#6b7280]">
            This phase is not yet available. Sign up to be notified when it launches.
          </p>
        </div>

        {isSignedUp ? (
          <p id="bounties-signup-success" className="text-xs font-mono text-[#16a34a] font-bold">
            ✓ Thank you! You will be notified the moment Phase 2 goes live.
          </p>
        ) : (
          <form id="bounties-notify-form" onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              id="bounties-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-grow px-3 py-2 border border-black text-xs text-[#0a0a0a] bg-white rounded-none focus:outline-none focus:border-black font-mono placeholder-[#6b7280]"
            />
            <button
              id="bounties-notify-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#0a0a0a] text-white font-mono text-xs font-bold hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Notify Me"}
            </button>
          </form>
        )}
      </div>

      {/* Blurred static preview */}
      <div id="bounties-preview-container" className="relative border border-[#e5e5e5] bg-[#f9f9f9] p-8">
        
        {/* Absolute Centered Coming Soon Overlay */}
        <div id="bounties-overlay" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#ffffff]/65 backdrop-blur-xs text-center p-4">
          <div className="border border-black bg-white p-6 max-w-xs space-y-2">
            <span className="text-[10px] bg-[#f3f3f3] text-[#6b7280] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              Phase 2
            </span>
            <h4 className="text-sm font-bold text-[#0a0a0a]">Coming Soon</h4>
            <p className="text-xs text-[#6b7280]">
              Stake rewards, publish analytical reviews, and claim bounties on GenLayer.
            </p>
          </div>
        </div>

        {/* Mock cards blurred behind */}
        <div id="bounties-mock-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 select-none pointer-events-none filter blur-xs">
          {[
            {
              title: "Lagos budget audit report corroboration",
              bounty: "2,500 GEN",
              date: "2026-07-15"
            },
            {
              title: "Room-temperature superconductivity replication data",
              bounty: "12,000 GEN",
              date: "2026-08-01"
            },
            {
              title: "JPL Asteroid 2026-FT9 vector simulation calculations",
              bounty: "5,000 GEN",
              date: "2026-07-20"
            }
          ].map((mock, idx) => (
            <div key={idx} className="border border-[#e5e5e5] bg-white p-6 space-y-4">
              <span className="text-[10px] font-mono font-bold text-[#6b7280]">BOUNTY AVAILABLE</span>
              <h4 className="text-sm font-bold text-[#0a0a0a] line-clamp-2">{mock.title}</h4>
              <div className="pt-2 border-t border-[#e5e5e5] flex justify-between text-xs font-mono">
                <span className="text-[#6b7280]">Bounty Amount:</span>
                <span className="font-bold text-[#0a0a0a]">{mock.bounty}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#6b7280]">Deadline:</span>
                <span className="font-bold text-[#0a0a0a]">{mock.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
