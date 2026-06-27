import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Category, Claim } from "../types";
import { useSubmitClaim } from "../hooks/TruthArena";

interface SubmitClaimPageProps {
  isConnected: boolean;
  walletAddress: string;
  onConnectClick: () => void;
  addToast: (msg: string, type: "success" | "error") => void;
}

export default function SubmitClaimPage({
  isConnected,
  walletAddress,
  onConnectClick,
  addToast
}: SubmitClaimPageProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("politics");
  const [sourceUrls, setSourceUrls] = useState<string[]>([""]);
  const [successClaimId, setSuccessClaimId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { isPending: isSubmittingClaim, mutate: SubmitClaim } = useSubmitClaim()

  const handleAddSource = () => {
    setSourceUrls([...sourceUrls, ""]);
  };

  const handleSourceChange = (index: number, val: string) => {
    const updated = [...sourceUrls];
    updated[index] = val;
    setSourceUrls(updated);
  };

  const handleRemoveSource = (index: number) => {
    const updated = sourceUrls.filter((_, i) => i !== index);
    setSourceUrls(updated.length === 0 ? [""] : updated);
  };

 const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isConnected) return;

  if (!title.trim() || !text.trim()) {
    setErrorMsg("Please fill out all required fields.");
    return;
  }
  setErrorMsg(null);
  setSuccessClaimId(null);

  SubmitClaim(
    {
      title: title,
      claim_text: text,
      category: category,
      source_urls: sourceUrls,
    },
    {
      onSuccess: () => {
        addToast("Claim successfully sent to GenLayer!", "success");
      },
      onError: (error: any) => {
        addToast("Failed to submit claim transaction.", "error");
        setErrorMsg(error?.message || "An error occurred during transaction signing.");
      },
    }
  );
};

const handleReset = () => {
  setSuccessClaimId(null);
  setErrorMsg(null);
};

return (
  <div id="submit-claim-container" className="py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto space-y-6">

    {/* Page Header */}
    <div id="submit-claim-header" className="space-y-2">
      <h2 id="submit-claim-title" className="text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
        Submit a Claim
      </h2>
      <p id="submit-claim-subtitle" className="text-sm text-[#6b7280]">
        Submit a public claim for AI fact-checking. Validators will investigate using live web sources.
      </p>
    </div>

    {/* Success State */}
    {successClaimId ? (
      <div id="success-state" className="border border-[#16a34a] p-6 bg-white space-y-4">
        <p id="success-msg" className="text-sm font-mono text-[#16a34a] font-bold flex items-center gap-2">
          <span>✓</span> Claim submitted successfully
        </p>
        <div className="flex flex-col sm:flex-row gap-4 text-xs font-mono">
          <a
            id="view-success-claim"
            href={`#/claims/${successClaimId}`}
            className="text-center px-4 py-2.5 bg-[#0a0a0a] text-white font-bold hover:opacity-95"
          >
            View your claim
          </a>
          <button
            id="submit-another-btn"
            onClick={handleReset}
            className="text-center px-4 py-2.5 border border-[#e5e5e5] hover:bg-[#f3f3f3] text-[#0a0a0a] font-bold"
          >
            Submit another
          </button>
        </div>
      </div>
    ) : (
      /* Form Block */
      <form id="submit-claim-form" onSubmit={handleFormSubmit} className="space-y-6">

        {/* Error Message */}
        {errorMsg && (
          <div id="form-error" className="border border-[#dc2626] p-4 bg-white text-xs font-mono text-[#dc2626]">
            {errorMsg}
          </div>
        )}

        {/* Field 1 — Claim Title */}
        <div id="field-title" className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#0a0a0a]">
            Title *
          </label>
          <input
            id="input-title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A short descriptive title for your claim"
            className="w-full px-4 py-2.5 border border-[#e5e5e5] text-sm text-[#0a0a0a] bg-white rounded-none focus:outline-none focus:border-black font-sans"
          />
          <span className="text-[11px] font-mono text-[#6b7280] block text-right">
            {title.length}/200 characters
          </span>
        </div>

        {/* Field 2 — Claim Text */}
        <div id="field-text" className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#0a0a0a]">
            The Claim *
          </label>
          <textarea
            id="input-text"
            required
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write the specific claim you want investigated.&#13;&#10;Be precise. Example: The Lagos State Government spent ₦10 billion renovating a single building."
            className="w-full px-4 py-2.5 border border-[#e5e5e5] text-sm text-[#0a0a0a] bg-white rounded-none focus:outline-none focus:border-black font-sans"
          />
          <span className="text-[11px] font-mono text-[#6b7280] block">
            Be specific and factual. Vague claims are harder to investigate.
          </span>
        </div>

        {/* Field 3 — Category */}
        <div id="field-category" className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#0a0a0a]">
            Category *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(["politics", "finance", "health", "science", "tech", "other"] as Category[]).map((cat) => (
              <button
                key={cat}
                id={`submit-cat-btn-${cat}`}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 text-xs font-mono border text-center transition-colors ${category === cat
                  ? "bg-[#0a0a0a] text-white border-black font-bold"
                  : "bg-white text-[#0a0a0a] border-[#e5e5e5] hover:bg-[#f3f3f3]"
                  }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Field 4 — Supporting Sources */}
        <div id="field-sources" className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#0a0a0a] block">
            Supporting Sources (optional)
          </label>
          <span className="text-[11px] font-mono text-[#6b7280] block">
            Add URLs that support or are relevant to this claim. AI validators will also search independently.
          </span>

          <div className="space-y-2">
            {sourceUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  id={`source-url-${index}`}
                  type="url"
                  value={url}
                  onChange={(e) => handleSourceChange(index, e.target.value)}
                  placeholder="https://example.com/source-evidence"
                  className="flex-grow px-3 py-2 border border-[#e5e5e5] text-xs text-[#0a0a0a] bg-white rounded-none focus:outline-none focus:border-black font-mono"
                />
                <button
                  id={`remove-source-btn-${index}`}
                  type="button"
                  onClick={() => handleRemoveSource(index)}
                  className="p-2 border border-[#e5e5e5] text-[#6b7280] hover:text-[#dc2626] hover:bg-[#f3f3f3]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            id="add-source-link"
            type="button"
            onClick={handleAddSource}
            className="text-xs font-mono font-bold text-[#0a0a0a] hover:underline flex items-center gap-1 mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add another source</span>
          </button>
        </div>

        {/* Submit Action Block */}
        <div id="submit-actions" className="pt-4 border-t border-[#e5e5e5] space-y-4">
          {isConnected ? (
            <>
              <button
                id="submit-form-btn"
                type="submit"
                disabled={isSubmittingClaim}
                className="w-full py-3.5 bg-[#0a0a0a] text-white font-mono text-sm font-bold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingClaim ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting to GenLayer...</span>
                  </>
                ) : (
                  "Submit Claim"
                )}
              </button>
              <p className="text-[11px] font-mono text-[#6b7280] text-center">
                Submitting creates an on-chain transaction via GenLayer. Your connected wallet will be prompted to sign.
              </p>
            </>
          ) : (
            <div id="wallet-connect-prompt" className="border border-[#e5e5e5] p-5 text-center bg-[#f9f9f9] space-y-3">
              <p className="text-sm font-mono text-[#6b7280]">
                Connect your wallet to submit a claim
              </p>
              <button
                id="form-connect-wallet-btn"
                type="button"
                onClick={onConnectClick}
                className="px-6 py-2 border border-black text-[#0a0a0a] bg-transparent font-mono text-xs font-bold hover:bg-[#f3f3f3]"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

      </form>
    )}

  </div>
);
}
