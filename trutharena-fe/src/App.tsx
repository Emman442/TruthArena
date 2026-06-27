import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"; // <-- New Hooks!
import { Claim, Category } from "./types";

// Component imports
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import ExploreClaimsPage from "./components/ExploreClaimsPage";
import ClaimDetailPage from "./components/ClaimDetailPage";
import SubmitClaimPage from "./components/SubmitClaimPage";
import ProfilePage from "./components/ProfilePage";
import BountiesPage from "./components/BountiesPage";
import MarketsPage from "./components/MarketsPage";
import ToastContainer, { Toast } from "./components/ToastContainer";
import { usePrivy, useWallets, useLogin } from "@privy-io/react-auth";

// Dummy wrapper for individual claim routing helper
import { useParams } from "react-router-dom";
import { useCheckIfProfileExists, useFetchClaim, useFetchClaims } from "./hooks/TruthArena";
import ProfileSetupModal from "./components/ProfileSetupModal";

export default function App() {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const navigate = useNavigate(); // <-- Replaces your manual window.location.hash switching
  const location = useLocation();  // <-- Replaces usePathname! Give you access to location.pathname
  const activeWallet = wallets[0];
  const walletAddress = activeWallet?.address || "";
  const isConnected = ready && authenticated && !!walletAddress;
  const { isLoading: isProfileLoading, data: profileExists } = useCheckIfProfileExists(walletAddress);
  // Toasts Notification State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const {isPending: isFetchingClaims, data: claims} = useFetchClaims()
  const [isTriggering, setIsTriggering] = useState(false);

  // Profile-gating states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const { login } = useLogin({
    onError: (err) => console.error(err)
  });


  useEffect(() => {
    // If there is no active wallet connected, reset tracking states and hide the modal
    if (!walletAddress) {
      setHasChecked(false);
      setShowSetupModal(false);
      return;
    }

    // Wait quietly if the contract profile query is still resolving on GenLayer
    if (isProfileLoading) return;

    // Guard constraint: Only flag or prompt a user once per wallet connection sequence
    if (hasChecked) return;
    setHasChecked(true);

    if (profileExists) {
      addToast("Welcome back to TruthArena!", "success");
    } else {
      // Trigger Onboarding modal if profile data row does not exist on-chain
      setShowSetupModal(true);
    }
  }, [walletAddress, isProfileLoading, profileExists, hasChecked]);


  // Helper component to extract ID from URL parameters smoothly
  const ClaimDetailWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const {isPending: isFetchingClaim, data: targetClaim} = useFetchClaim(id)

    if (isFetchingClaim) return <div className="py-16 text-center font-mono text-[#6b7280]">Fetching claim logs...</div>;
    if (!targetClaim) return <div className="py-16 text-center text-sm font-mono text-[#dc2626]">Error: Claim not found.</div>;
    console.log(targetClaim)
    return (
      <ClaimDetailPage
        claim={targetClaim}
        onNavigate={(path) => navigate(`/${path}`)}
      />
    );
  };

  return (
    <div id="trutharena-app" className="min-h-screen bg-white text-[#0a0a0a] font-sans flex flex-col antialiased">
      <Navbar
        isConnected={isConnected}
        walletAddress={walletAddress}
        onConnectClick={login}
        onDisconnect={logout}
        currentPath={location.pathname.replace("/", "") || "home"} // maps cleanly to your active highlights
        onNavigate={(path) => navigate(`/${path}`)} // changes routes declaratively
      />

      {/* Profile Verification Overlay Lock */}
      {walletAddress && isProfileLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="font-mono text-xs text-gray-500">Verifying TruthArena Identity registration...</p>
        </div>
      )}

      {/* Onboarding Trigger Modal */}
      <ProfileSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        address={walletAddress}
        onProfileCreated={() => {
          setShowSetupModal(false);
          addToast("Profile synchronized successfully!", "success");
        }}
      />

      <main id="main-content" className="flex-grow">
        {!ready ? (
          <div className="py-16 text-center font-mono text-[#6b7280]">Initializing Auth Services...</div>
        ) : (
          /* Declarative Engine Configuration mapping layout routes to clean URLs */
          <Routes>
            <Route path="/" element={<LandingPage claims={claims} onNavigate={(path) => navigate(`/${path}`)} />} />
            <Route path="/claims" element={<ExploreClaimsPage claims={claims} onNavigate={(path) => navigate(`/${path}`)} isLoading={isFetchingClaims} />} />
            <Route path="/claims/:id" element={<ClaimDetailWrapper />} />
            <Route path="/submit" element={<SubmitClaimPage isConnected={isConnected} walletAddress={walletAddress} onConnectClick={login} addToast={addToast}/>} />
            <Route path="/profile" element={<ProfilePage isConnected={isConnected} walletAddress={walletAddress} onNavigate={(path) => navigate(`/${path}`)} addToast={addToast} />} />
            <Route path="/bounties" element={<BountiesPage addToast={addToast} />} />
            <Route path="/markets" element={<MarketsPage addToast={addToast} />} />
          </Routes>
        )}
      </main>

      <footer className="border-t border-[#e5e5e5] py-8 text-center text-xs font-mono text-[#6b7280]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 TruthArena — Powered by GenLayer Intelligent Contracts</span>
          <span className="text-[10px] bg-[#f9f9f9] border border-[#e5e5e5] px-2 py-1">Studionet Node Active</span>
        </div>
      </footer>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}