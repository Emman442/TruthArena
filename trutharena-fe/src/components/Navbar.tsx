import { useState } from "react";
import { Menu, X, Wallet, ChevronDown } from "lucide-react";

interface NavbarProps {
  isConnected: boolean;
  walletAddress: string;
  onConnectClick: () => void;
  onDisconnect: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Navbar({
  isConnected,
  walletAddress,
  onConnectClick,
  onDisconnect,
  currentPath,
  onNavigate
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleDropdownItemClick = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
  };

  return (
    <nav
      id="main-navigation"
      className="sticky top-0 z-40 w-full bg-white border-b border-[#e5e5e5] px-4 py-3 sm:px-6 md:px-8"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Wordmark */}
        <button
          id="nav-brand"
          onClick={() => handleLinkClick("home")}
          className="text-lg sm:text-xl font-bold tracking-tight text-[#0a0a0a] hover:opacity-85 transition-opacity"
        >
          TruthArena
        </button>

        {/* Center/Right Desktop Navigation */}
        <div id="desktop-nav" className="hidden lg:flex items-center gap-6">
          <button
            id="nav-explore"
            onClick={() => handleLinkClick("claims")}
            className={`font-medium text-sm transition-colors ${
              currentPath === "claims" ? "text-[#0a0a0a] underline underline-offset-4" : "text-[#6b7280] hover:text-[#0a0a0a]"
            }`}
          >
            Explore Claims
          </button>
          <button
            id="nav-submit"
            onClick={() => handleLinkClick("submit")}
            className={`font-medium text-sm transition-colors ${
              currentPath === "submit" ? "text-[#0a0a0a] underline underline-offset-4" : "text-[#6b7280] hover:text-[#0a0a0a]"
            }`}
          >
            Submit Claim
          </button>

          {/* Coming Soon: Bounties */}
          <span
            id="nav-bounties-coming-soon"
            className="text-sm text-[#6b7280] cursor-default font-medium flex items-center gap-1.5"
            title="Phase 2 - Investigation Bounties"
          >
            Investigation Bounties
            <span className="text-[10px] bg-[#f3f3f3] text-[#6b7280] px-1.5 py-0.5 rounded-full font-mono font-normal">
              Coming Soon
            </span>
          </span>

          {/* Coming Soon: Markets */}
          <span
            id="nav-markets-coming-soon"
            className="text-sm text-[#6b7280] cursor-default font-medium flex items-center gap-1.5"
            title="Phase 3 - Truth Markets"
          >
            Truth Markets
            <span className="text-[10px] bg-[#f3f3f3] text-[#6b7280] px-1.5 py-0.5 rounded-full font-mono font-normal">
              Coming Soon
            </span>
          </span>
        </div>

        {/* Right Desktop Action Button / Account pill */}
        <div id="desktop-actions" className="hidden lg:flex items-center gap-3">
          {isConnected ? (
            <div className="relative">
              <button
                id="wallet-dropdown-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-[#0a0a0a] text-white text-xs font-mono font-medium px-4 py-2  hover:opacity-90 transition-opacity"
              >
                <span>{truncateAddress(walletAddress)} </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isDropdownOpen && (
                <div
                  id="wallet-dropdown"
                  className="absolute right-0 mt-2 w-48 bg-white border border-[#e5e5e5] rounded-none py-1 z-50 text-sm"
                >
                  <button
                    id="nav-profile-dropdown"
                    onClick={() => handleDropdownItemClick(() => handleLinkClick("profile"))}
                    className="w-full text-left px-4 py-2 text-[#0a0a0a] hover:bg-[#f3f3f3]"
                  >
                    Your Profile
                  </button>
                  <button
                    id="disconnect-wallet-dropdown"
                    onClick={() => handleDropdownItemClick(onDisconnect)}
                    className="w-full text-left px-4 py-2 text-[#dc2626] hover:bg-[#f3f3f3] border-t border-[#e5e5e5]"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="connect-wallet-btn"
              onClick={onConnectClick}
              className="px-4 py-2 text-xs font-mono font-medium border border-black text-[#0a0a0a] bg-transparent hover:bg-[#f3f3f3] transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-1.5 border border-[#e5e5e5] hover:bg-[#f3f3f3]"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay & Content */}
      {isMobileMenuOpen && (
        <div
          id="mobile-drawer-overlay"
          className="fixed inset-0 top-[53px] z-30 bg-white border-t border-[#e5e5e5] flex flex-col p-6 space-y-6 lg:hidden"
        >
          <div className="flex flex-col space-y-4">
            <button
              id="mobile-nav-explore"
              onClick={() => handleLinkClick("claims")}
              className={`text-left font-bold text-lg ${
                currentPath === "claims" ? "text-[#0a0a0a]" : "text-[#6b7280]"
              }`}
            >
              Explore Claims
            </button>
            <button
              id="mobile-nav-submit"
              onClick={() => handleLinkClick("submit")}
              className={`text-left font-bold text-lg ${
                currentPath === "submit" ? "text-[#0a0a0a]" : "text-[#6b7280]"
              }`}
            >
              Submit Claim
            </button>

            <hr className="border-[#e5e5e5]" />

            <div className="flex flex-col space-y-1">
              <span className="text-sm font-bold text-[#6b7280]">Investigation Bounties</span>
              <span className="text-xs text-[#9ca3af] flex items-center gap-1.5">
                Phase 2 — <span className="bg-[#f3f3f3] px-1.5 py-0.5 rounded-full text-[10px]">Coming Soon</span>
              </span>
            </div>

            <div className="flex flex-col space-y-1 pt-2">
              <span className="text-sm font-bold text-[#6b7280]">Truth Markets</span>
              <span className="text-xs text-[#9ca3af] flex items-center gap-1.5">
                Phase 3 — <span className="bg-[#f3f3f3] px-1.5 py-0.5 rounded-full text-[10px]">Coming Soon</span>
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-[#e5e5e5] flex flex-col space-y-3 mt-auto">
            {isConnected ? (
              <>
                <div className="bg-[#f9f9f9] border border-[#e5e5e5] p-3 text-sm font-mono flex flex-col gap-1">
                  <span className="text-[#6b7280] text-xs">Wallet Account</span>
                  <span className="font-bold text-[#0a0a0a]">{truncateAddress(walletAddress)}</span>
                </div>
                <button
                  id="mobile-nav-profile"
                  onClick={() => handleLinkClick("profile")}
                  className="w-full py-2.5 text-center text-sm font-medium border border-[#e5e5e5] hover:bg-[#f3f3f3]"
                >
                  Your Profile
                </button>
                <button
                  id="mobile-disconnect-wallet"
                  onClick={() => {
                    onDisconnect();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-medium bg-[#dc2626] text-white"
                >
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <button
                id="mobile-connect-wallet"
                onClick={() => {
                  onConnectClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 bg-[#0a0a0a] text-white text-sm font-mono font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
