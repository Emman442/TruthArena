import { TransactionReceipt } from "@privy-io/react-auth";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

import { TransactionStatus } from "genlayer-js/types"
import { parseEther } from "viem";
import { Claim, FactCheckResult, UserProfile } from "@/src/types";


class TruthArena {
    private contractAddress: `0x${string}`;
    private client: ReturnType<typeof createClient>;

    constructor(
        contractAddress: string,
        address?: string | null,
        studioUrl?: string
    ) {
        this.contractAddress = contractAddress as `0x${string}`;

        const config: any = {
            chain: studionet,
        };

        if (address) {
            config.account = address as `0x${string}`;
        }

        if (studioUrl) {
            config.endpoint = studioUrl;
        }

        this.client = createClient(config);
    }

    /**
     * Update the address used for transactions
     */
    updateAccount(address: string): void {
        const config: any = {
            chain: studionet,
            account: address as `0x${string}`,
        };

        this.client = createClient(config);
    }


    /**
     * Get a particular user profile from the contract
     * @returns a user profile object with all relevant details
     */
    async CheckIfProfileExists(account_address: string): Promise<boolean> {

        try {
            const profile_exists: any = await this.client.readContract({
                address: this.contractAddress,
                functionName: "user_exists",
                args: [account_address],
            });

            return profile_exists as boolean;

        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw new Error("Failed to check if user profile exists");
        }
    }


    async getUserProfile(wallet_address: string): Promise<UserProfile
    > {
        try {
            const profile: any = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_user",
                args: [wallet_address],
            });

            console.log("profile: ", profile)


            return profile as UserProfile;

        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw new Error("Failed to fetch user profile");
        }
    }

    async getClaimById(claim_id: string): Promise<Claim
    > {
        try {
            const claim: any = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_claim",
                args: [claim_id],
            });

            return claim as Claim;

        } catch (error) {
            console.error("Error fetching claim:", error);
            throw new Error("Failed to fetch claim");
        }
    }


    async getFactCheckResult(claim_id: string): Promise<FactCheckResult
    > {
        try {
            const result: any = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_fact_check_result",
                args: [claim_id],
            });

            return result as FactCheckResult;

        } catch (error) {
            console.error("Error fetching results:", error);
            throw new Error("Failed to fetch results");
        }
    }

    async getAllClaims(): Promise<Claim[]
    > {
        try {
            const claims: any = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_all_claims",
            });


            return claims as Claim[];

        } catch (error) {
            console.error("Error fetching claims: ", error);
            throw new Error("Failed to fetch claims");
        }
    }

    async createProfile(username: string) {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "register_user",
                args: [username],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: "ACCEPTED" as any,
            });
            console.log("Receopttt", receipt)
            return receipt as TransactionReceipt
                ;
        } catch (error) {
            console.error("Error creating profile:", error);
            throw new Error("Failed to create profile");
        }
    }


    async submitClaim(
        title: string,
        claim_text: string,
        category: string,
        source_urls: [string]
    ) {

        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "submit_claim",
                args: [title, claim_text, category, source_urls],
                value: BigInt(0)
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });

            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error submitting claim: ", error);
            throw new Error("Failed to submit your claim");
        }
    }

    async investigateClaim(
        claim_id: string,
    ) {

        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "investigate_claim",
                args: [claim_id],
                value: BigInt(0)
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
                retries: 60,
                interval: 5000,
            });

            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error investigating claim: ", error);
            throw new Error("Failed to investigate claim");
        }
    }







}


export default TruthArena;