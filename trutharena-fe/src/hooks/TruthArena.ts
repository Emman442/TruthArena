"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import TruthArena from "@/src/lib/contract/TruthArena"
import { getContractAddress } from "../lib/genlayer/client";
import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { Claim, FactCheckResult, UserProfile } from "../types";


export function useTruthArenaContract(): TruthArena | null {
    const { wallets } = useWallets();
    const contractAddress = getContractAddress();
    const address = wallets[0]?.address;

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
                queryKey: ["claim"],
            });
        },
        onError: async (error) => {
            console.error("Error investigating claim:", error);
            toast.error("Failed to Investigate claim. Please try again.");
        }
    });
}