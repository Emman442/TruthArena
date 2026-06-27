import { useState } from "react";
import { Shield } from "lucide-react";
import { useCreateProfile } from "../hooks/TruthArena";
import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { Input } from "./Input";
import Modal from "./modal";

interface ProfileSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileCreated: () => void;
    address: string;
}

export default function ProfileSetupModal({
    isOpen,
    onClose,
    onProfileCreated,
    address,
}: ProfileSetupModalProps) {
    const [username, setUsername] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const createProfileMutation = useCreateProfile();
    const { wallets } = useWallets();

    const handleCreateProfile = async () => {
        if (!username) return;

        try {
            setIsCreating(true);

            await createProfileMutation.mutateAsync({
                username,
            });

            onProfileCreated();
        } catch (err) {
            console.error(err);
            toast.error("Failed to create profile", {
                description: err instanceof Error ? err.message : "Something went wrong",
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            size="md"
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                        {/* <Shield className="w-6 h-6 text-primary" /> */}
                    </div>
                    <h2 className="text-xl font-bold text-black">
                        Welcome to TruthArena
                    </h2>
                    <p>Set up your profile to get started</p>

                </div>


                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Username
                        </label>
                        <Input
                            placeholder="e.g. emmanuel_dev"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-black/6 border-white/10"
                        />
                    </div>

                    <button onClick={handleCreateProfile} disabled={isCreating} className="flex items-center gap-2 bg-[#0a0a0a] text-white text-xs font-mono font-medium px-4 py-2.5 hover:opacity-90 transition-opacity mx-auto">
                        {isCreating ? "Creating Profile..." : "Create Profile"}
                    </button>

                    <div className="p-3 rounded-lg bg-black/5 border border-white/10">
                        <p className="text-xs text-muted-foreground">
                            Registering with wallet{" "}
                            <span className="font-mono">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                        </p>
                    </div>
                </div>

            </div>
        </Modal>
    );
}