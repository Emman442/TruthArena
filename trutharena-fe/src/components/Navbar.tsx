"use client";

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
        
        {/* Brand Logo */}
        <button onClick={() => handleLinkClick("home")} className="text-lg sm:text-xl font-bold tracking-tight text-[#0a0a0a] hover:opacity-85 transition-opacity">
          TruthArena
        </button>

        {/* Desktop Links */}
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

        {/* Core Connection Engine Instance */}
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div className="flex items-center gap-4" {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                
                {/* 1. Desktop Actions Wrapper (Hidden on Mobile) */}
                <div id="desktop-actions" className="hidden lg:flex items-center gap-3">
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
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e5e5e5] py-1 z-50 text-sm shadow-md">
                          <button
                            onClick={() => { setIsDropdownOpen(false); onDisconnect(); }}
                            className="w-full text-left px-4 py-2 text-[#dc2626] hover:bg-[#f3f3f3]"
                          >
                            Disconnect
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Mobile Layout Hamburger Button */}
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1.5 border border-[#e5e5e5] hover:bg-[#f3f3f3] text-[#0a0a0a]">
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* 3. Fully functional Mobile Menu Drawer */}
                {isMobileMenuOpen && (
                  <div className="absolute top-[100%] left-0 w-full bg-white border-b border-[#e5e5e5] px-4 py-6 flex flex-col gap-4 lg:hidden shadow-lg z-50">
                    <button onClick={() => handleLinkClick("claims")} className={`text-left font-medium text-sm py-2 ${currentPath === "claims" ? "text-[#0a0a0a] font-bold" : "text-[#6b7280]"}`}>
                      Explore Claims
                    </button>
                    <button onClick={() => handleLinkClick("submit")} className={`text-left font-medium text-sm py-2 ${currentPath === "submit" ? "text-[#0a0a0a] font-bold" : "text-[#6b7280]"}`}>
                      Submit Claim
                    </button>
                    <button onClick={() => handleLinkClick("markets")} className={`text-left font-medium text-sm py-2 ${currentPath === "markets" ? "text-[#0a0a0a] font-bold" : "text-[#6b7280]"}`}>
                      Truth Markets
                    </button>
                    
                    <div className="border-t border-[#e5e5e5] pt-4 mt-2">
                      {!connected ? (
                        <button
                          onClick={() => { setIsMobileMenuOpen(false); openConnectModal(); }}
                          className="w-full flex justify-center items-center px-4 py-2.5 text-sm font-mono font-medium border border-black text-[#0a0a0a] bg-transparent hover:bg-[#f3f3f3]"
                        >
                          Connect Wallet
                        </button>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-center bg-[#f3f3f3] px-4 py-2 text-xs font-mono font-medium text-[#0a0a0a]">
                            <span>Account:</span>
                            <span>{truncateAddress(walletAddress)}</span>
                          </div>
                          <button
                            onClick={() => { setIsMobileMenuOpen(false); onDisconnect(); }}
                            className="w-full text-center px-4 py-2.5 text-sm font-medium bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors"
                          >
                            Disconnect Wallet
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          }}
        </ConnectButton.Custom>

      </div>
    </nav>
  );
}