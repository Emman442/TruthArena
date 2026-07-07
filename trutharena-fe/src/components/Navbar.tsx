import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { getAddress } from "viem";
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface NavbarProps {
  isConnected: boolean;
  walletAddress: string;
  onDisconnect: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Navbar({
  isConnected,
  walletAddress: LowerCaseAddress,
  onDisconnect,
  currentPath,
  onNavigate
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const walletAddress = LowerCaseAddress ? getAddress(LowerCaseAddress) : "";

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav id="main-navigation" className="sticky top-0 z-40 w-full bg-white border-b border-[#e5e5e5] px-4 py-3 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <button onClick={() => handleLinkClick("home")} className="text-lg sm:text-xl font-bold tracking-tight text-[#0a0a0a] hover:opacity-85 transition-opacity">
          TruthArena
        </button>

        <div id="desktop-nav" className="hidden lg:flex items-center gap-6">
          <button onClick={() => handleLinkClick("claims")} className={`font-medium text-sm transition-colors ${currentPath === "claims" ? "text-[#0a0a0a] underline underline-offset-4" : "text-[#6b7280] hover:text-[#0a0a0a]"}`}>
            Explore Claims
          </button>
          <button onClick={() => handleLinkClick("submit")} className={`font-medium text-sm transition-colors ${currentPath === "submit" ? "text-[#0a0a0a] underline underline-offset-4" : "text-[#6b7280] hover:text-[#0a0a0a]"}`}>
            Submit Claim
          </button>
          <button onClick={() => handleLinkClick("markets")} className={`font-medium text-sm transition-colors ${currentPath === "markets" ? "text-[#0a0a0a] underline underline-offset-4" : "text-[#6b7280] hover:text-[#0a0a0a]"}`}>
            Truth Markets
          </button>
        </div>

        {/* Desktop Actions Section Using RainbowKit UI Custom Hook */}
        <div id="desktop-actions" className="hidden lg:flex items-center gap-3">
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                  {!connected ? (
                    <button
                      onClick={openConnectModal}
                      className="flex gap-2 items-center px-4 py-2 text-xs font-mono font-medium border border-black text-[#0a0a0a] bg-transparent hover:bg-[#f3f3f3] transition-colors"
                    >
                      Connect Wallet
                    </button>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 bg-[#0a0a0a] text-white text-xs font-mono font-medium px-4 py-2 hover:opacity-90 transition-opacity"
                      >
                        <span>{truncateAddress(walletAddress)}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e5e5e5] py-1 z-50 text-sm">
                          {/* <button
                            onClick={() => { setIsDropdownOpen(false); handleLinkClick("profile"); }}
                            className="w-full text-left px-4 py-2 text-[#0a0a0a] hover:bg-[#f3f3f3]"
                          >
                            Your Profile
                          </button>
                          <button
                            onClick={() => { setIsDropdownOpen(false); openAccountModal(); }}
                            className="w-full text-left px-4 py-2 text-neutral-600 hover:bg-[#f3f3f3] border-t border-[#e5e5e5]"
                          >
                            Wallet Details
                          </button> */}
                          <button
                            onClick={() => { setIsDropdownOpen(false); onDisconnect(); }}
                            className="w-full text-left px-4 py-2 text-[#dc2626] hover:bg-[#f3f3f3] border-t border-[#e5e5e5]"
                          >
                            Disconnect
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>

        {/* Mobile Hamburger Layout Trigger */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1.5 border border-[#e5e5e5] hover:bg-[#f3f3f3]">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer remains identical but can use raw custom connection status triggers */}
    </nav>
  );
}