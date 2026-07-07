"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import TruthArena from "@/src/lib/contract/TruthArena"
import { getContractAddress } from "../lib/genlayer/client";
import { toast } from "sonner";
import { Claim, FactCheckResult, Investigation, MarketPosition, UserProfile } from "../types";
import { getAddress } from "viem";
import { useAccount } from "wagmi";


export function useTruthArenaContract(): TruthArena | null {
    const contractAddress = getContractAddress();
    const { address: rawAddress } = useAccount();
    const address = rawAddress ? getAddress(rawAddress) : "";
    return useMemo(() => {
        if (!contractAddress || !address) {
            return null;
        }
        return new TruthArena(contractAddress, address);
    }, [contractAddress, address]);
}

export function useCheckIfProfileExists(account_address: string | null) {
    const contract = useTruthArenaContract();

    return useQuery<boolean, Error>({
        queryKey: ["profileExists", account_address],
        queryFn: async () => {
            if (!account_address) return false;
            if (!contract) throw new Error("Contract not initialized");

            return await contract.CheckIfProfileExists(account_address);
        },
        enabled: !!account_address && !!contract,
        retry: false,
    });
}

export function useUserProfile(wallet_address: string) {
    const contract = useTruthArenaContract();

    return useQuery<UserProfile, Error>({
        queryKey: ["userProfile", wallet_address],
        queryFn: () => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }
            return contract.getUserProfile(wallet_address);
        },
        enabled: !!contract && !!wallet_address,
    });
}


export function useFetchClaim(claim_id: string) {
    const contract = useTruthArenaContract();

    return useQuery<Claim, Error>({
        queryKey: ["claim", claim_id],
        queryFn: () => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }
            return contract.getClaimById(claim_id);
        },
        enabled: !!contract && !!claim_id,
    });
}

export function useFetchClaimInvestigations(claim_id: string) {
    const contract = useTruthArenaContract();

    return useQuery<Investigation[], Error>({
        queryKey: ["claim", claim_id],
        queryFn: () => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }
            return contract.getClaimInvestigations(claim_id);
        },
        enabled: !!contract && !!claim_id,
    });
}


export function useFetchFactCheckResult(claim_id: string) {
    const contract = useTruthArenaContract();

    return useQuery<FactCheckResult, Error>({
        queryKey: ["fact_check_result", claim_id],
        queryFn: () => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }
            return contract.getFactCheckResult(claim_id);
        },
        enabled: !!contract && !!claim_id,
    });
}

export function useFetchClaims() {
    const contract = useTruthArenaContract();

    return useQuery<Claim[], Error>({
        queryKey: ["claims"],
        queryFn: () => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }
            return contract.getAllClaims();
        },
        enabled: !!contract
    });
}



export function useFetchClaimPositions(claim_id: string) {
    const contract = useTruthArenaContract();

    return useQuery<MarketPosition[], Error>({
        queryKey: ["claim_positions", claim_id],
        queryFn: () => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }
            return contract.getClaimPositions(claim_id);
        },
        enabled: !!contract && !!claim_id
    });
}



export function useCreateProfile() {
    const contract = useTruthArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            username,
        }: {
            username: string;
        }) => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }

            const receipt = await contract.createProfile(username);
            console.log("Profile creation transaction receipt:", receipt);
            return receipt;
        },

        onSuccess: async (_, variables) => {
            // refresh any relevant reads after profile creation
            await queryClient.invalidateQueries({
                queryKey: ["profileExists"],
            });

            await queryClient.invalidateQueries({
                queryKey: ["profile"],
            });
        },
    });
}



export function useSubmitClaim() {
    const contract = useTruthArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            title,
            claim_text,
            category,
            source_urls
        }: {
            title: string,
            claim_text: string,
            category: string,
            source_urls: [string]
        }) => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }

            const receipt = await contract.submitClaim(title, claim_text, category, source_urls);
            console.log("Submit claim tx receipt:", receipt);
            return receipt;
        },

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ["claim"],
            });
            await queryClient.invalidateQueries({
                queryKey: ["claims"],
            });
        },
        onError: async (error) => {
            console.error("Error submitting claim:", error);
            toast.error("Failed to submit claim. Please try again.");
        }
    });
}

export function useInvestigateClaim() {
    const contract = useTruthArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            claim_id
        }: {
            claim_id: string
        }) => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }

            const receipt = await contract.investigateClaim(claim_id);
            console.log("Investigate claim tx receipt:", receipt);
            return receipt;
        },

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ["claim", variables.claim_id],
            });
            await queryClient.invalidateQueries({
                queryKey: ["claims"],
            });
            await queryClient.invalidateQueries({
                queryKey: ["fact_check_result", variables.claim_id],
            });
        },
        onError: async (error) => {
            console.error("Error investigating claim:", error);
            toast.error("Failed to Investigate claim. Please try again.");
        }
    });

}


export function usePlaceBet() {
    const contract = useTruthArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            claim_id,
            position,
            stake_amount
        }: {
            claim_id: string;
            position: string;
            stake_amount: number;
        }) => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }

            const receipt = await contract.takePosition(claim_id, position, stake_amount);
            console.log("Bets placed tx receipt:", receipt);
            return receipt;
        },

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ["claim"],
            });

            await queryClient.invalidateQueries({
                queryKey: ["claim_positions", variables.claim_id],
            });
            await queryClient.invalidateQueries({
                queryKey: ["claims"],
            });
        },
        onError: async (error) => {
            console.error("Error Placing bets:", error);
            toast.error("Failed to place prediciton. Please try again.");
        }
    });
}


export function useOpenTruthMarket() {
    const contract = useTruthArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            claim_id,
            deadline_seconds
        }: {
            claim_id: string;
            deadline_seconds: number;
        }) => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }

            const receipt = await contract.openTruthMarket(claim_id, deadline_seconds);
            console.log("Truth market opened tx receipt:", receipt);
            return receipt;
        },

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ["claim"],
            });
        },
        onError: async (error) => {
            console.error("Error opening truth market:", error);
            toast.error("Failed to open truth market. Please try again.");
        }
    });
}

export function useResolveTruthMarket() {
    const contract = useTruthArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            claim_id,

        }: {
            claim_id: string;

        }) => {
            if (!contract) {
                throw new Error("Contract not initialized");
            }

            const receipt = await contract.resolveTruthMarket(claim_id);
            console.log("Truth market resolved tx receipt:", receipt);
            return receipt;
        },

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ["claim"],
            });
        },
        onError: async (error) => {
            console.error("Error resolving truth market:", error);
            toast.error("Failed to resolve truth market. Please try again.");
        }
    });
}

