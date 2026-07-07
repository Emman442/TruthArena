import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"; // <-- New Hooks!
import { Claim, Category } from "./types";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import ExploreClaimsPage from "./components/ExploreClaimsPage";
import ClaimDetailPage from "./components/ClaimDetailPage";
import SubmitClaimPage from "./components/SubmitClaimPage";
import ProfilePage from "./components/ProfilePage";
import BountiesPage from "./components/BountiesPage";
import MarketsPage from "./components/MarketsPage";
import ToastContainer, { Toast } from "./components/ToastContainer";
import { useParams } from "react-router-dom";
import { useCheckIfProfileExists, useFetchClaim, useFetchClaims } from "./hooks/TruthArena";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { getAddress } from "viem";
import { useAccount, useDisconnect } from "wagmi";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address: rawAddress, isConnected, isConnecting: isLoading } = useAccount();
  const { disconnect } = useDisconnect();

  const walletAddress = rawAddress ? getAddress(rawAddress) : "";
  const { isLoading: isProfileLoading, data: profileExists } = useCheckIfProfileExists(walletAddress || null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isPending: isFetchingClaims, data: claims } = useFetchClaims()
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };


  useEffect(() => {
    if (!walletAddress) {
      setHasChecked(false);
      setShowSetupModal(false);
      return;
    }

    // 2. Wait quietly if the hook is loading OR if the profile data hasn't hit yet
    if (isProfileLoading || profileExists === undefined) return;

    // 3. Guard constraint: Only resolve once per settled query result
    if (hasChecked) return;

    if (profileExists === true) {
      addToast("Welcome back to TruthArena!", "success");
      setShowSetupModal(false); // Force close modal if open
      setHasChecked(true);      // Lock the sequence
    } else if (profileExists === false) {
      // Trigger Onboarding modal if profile data row definitely does not exist on-chain
      setShowSetupModal(true);
      setHasChecked(true);      // Lock the sequence
    }
  }, [walletAddress, isProfileLoading, profileExists, hasChecked]);

  // Helper component to extract ID from URL parameters smoothly
  const ClaimDetailWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const { isPending: isFetchingClaim, data: targetClaim } = useFetchClaim(id)

    if (isFetchingClaim) return <div className="py-16 text-center font-mono text-[#6b7280]">Fetching claim logs...</div>;
    if (!targetClaim) return <div className="py-16 text-center text-sm font-mono text-[#dc2626]">Error: Claim not found.</div>;
    console.log(targetClaim)
    return (
      <ClaimDetailPage
        addToast={addToast}
        claim={targetClaim}
        onNavigate={(path) => navigate(`/${path}`)}
        walletAddress={walletAddress}
      />
    );
  };
  console.log(profileExists, walletAddress)

  return (
    <div id="trutharena-app" className="min-h-screen bg-white text-[#0a0a0a] font-sans flex flex-col antialiased">
      <Navbar
        isConnected={isConnected} 
        walletAddress={walletAddress} 
        onDisconnect={disconnect}
        currentPath={location.pathname.replace("/", "") || "home"} 
        onNavigate={(path) => navigate(`/${path}`)}
      />

      {/* Profile Verification Overlay Lock */}
      {walletAddress && isProfileLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="font-mono text-xs text-gray-500">Verifying TruthArena Identity registration...</p>
        </div>
      )}

      {/* Onboarding Trigger Modal */}
      {isConnected && !profileExists && (<ProfileSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        address={walletAddress}
        onProfileCreated={() => {
          setShowSetupModal(false);
          addToast("Profile synchronized successfully!", "success");
        }}
      />)}

      <main id="main-content" className="flex-grow">
        {isLoading ? (
          <div className="py-16 text-center font-mono text-[#6b7280]">Initializing Auth Services...</div>
        ) : (
          /* Declarative Engine Configuration mapping layout routes to clean URLs */
          <Routes>
            <Route path="/" element={<LandingPage onNavigate={(path) => navigate(`/${path}`)} />} />
            <Route path="/claims" element={<ExploreClaimsPage claims={claims} onNavigate={(path) => navigate(`/${path}`)} isLoading={isFetchingClaims} />} />
            <Route path="/claims/:id" element={<ClaimDetailWrapper />} />
            <Route path="/submit" element={<SubmitClaimPage isConnected={isConnected} walletAddress={walletAddress} addToast={addToast} />} />
            <Route path="/profile" element={<ProfilePage isConnected={isConnected} walletAddress={walletAddress} onNavigate={(path) => navigate(`/${path}`)} addToast={addToast} />} />
            <Route path="/bounties" element={<BountiesPage addToast={addToast} isConnected={isConnected} walletAddress={walletAddress} onNavigate={(path) => navigate(`/${path}`)} />} />
            <Route path="/markets" element={<MarketsPage addToast={addToast} isConnected={isConnected} walletAddress={walletAddress} onNavigate={(path) => navigate(`/${path}`)} />} />
          </Routes>
        )}
      </main>

      <footer className="border-t border-[#e5e5e5] py-8 text-center text-xs font-mono text-[#6b7280]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 TruthArena — Powered by GenLayer Intelligent Contracts</span>
          <span className="text-[10px] bg-[#f9f9f9] border border-[#e5e5e5] px-2 py-1">Studionet</span>
        </div>
      </footer>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}