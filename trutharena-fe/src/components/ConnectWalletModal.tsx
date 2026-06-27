import { useState } from "react";
import { X, Wallet } from "lucide-react";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}

export default function ConnectWalletModal({ isOpen, onClose, onConnect }: ConnectWalletModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      // Generate a static mock address
      onConnect("0x71C644E297676767676767676767676767676767");
      onClose();
    }, 1200);
  };

  return (
    <div id="wallet-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div
        id="wallet-modal-content"
        className="relative w-full max-w-md bg-white border border-[#e5e5e5] p-6 text-[#0a0a0a]"
      >
        {/* Close Button */}
        <button
          id="wallet-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <h3 id="wallet-modal-title" className="text-xl font-bold tracking-tight mb-2">
          Connect Wallet
        </h3>
        <p id="wallet-modal-subtitle" className="text-sm text-[#6b7280] mb-6">
          Connect your Web3 credentials to start signing claims and running AI-based consensus verdicts on GenLayer.
        </p>

        {/* Provider List */}
        <div id="wallet-provider-list" className="space-y-3">
          <button
            id="connect-metamask"
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full flex items-center justify-between p-4 border border-[#e5e5e5] hover:bg-[#f3f3f3] transition-colors font-mono text-sm font-medium"
          >
            <div className="flex items-center gap-3">
              {/* Minimalist Wallet Icon */}
              <Wallet className="w-5 h-5 text-[#0a0a0a]" />
              <span>MetaMask</span>
            </div>
            <span className="text-xs text-[#6b7280]">
              {isConnecting ? "Connecting..." : "Popular"}
            </span>
          </button>
        </div>

        {/* Informative Help Text */}
        <div id="wallet-network-info" className="mt-6 p-4 bg-[#f9f9f9] border border-[#e5e5e5] text-xs text-[#6b7280] space-y-1">
          <p className="font-semibold text-[#0a0a0a]">Network Information</p>
          <p>
            TruthArena uses <strong>GenLayer Studionet</strong>. You may be prompted to add or switch the network to MetaMask when you sign.
          </p>
        </div>
      </div>
    </div>
  );
}
