import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PrivyProvider } from '@privy-io/react-auth';
import React, { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {

    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 2000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );



    const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
    const privyClientId = import.meta.env.VITE_PRIVY_CLIENT_ID;
    // Safety check
    if (!privyAppId || !privyClientId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold">Configuration Error</h2>
                    <p className="text-muted-foreground">Privy App ID is missing. Check environment variables.</p>
                </div>
            </div>
        );
    }


    return (
        <QueryClientProvider client={queryClient}>
            <PrivyProvider
                appId={privyAppId!}
                clientId={privyClientId!}
                config={{
                    // Create embedded wallets for users who don't have a wallet
                    embeddedWallets: {
                        ethereum: {
                            createOnLogin: 'users-without-wallets'
                        }
                    },
                    loginMethods: ['wallet', 'email', 'google', 'apple'],
                    supportedChains: [
                        // Add GenLayer here
                        {
                            id: 61999, // Replace with GenLayer's actual chain ID
                            name: "GenLayer Studio",
                            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
                            rpcUrls: {
                                default: { http: ["https://studio.genlayer.com/api"] }, // Use the correct RPC
                            },
                        },

                        // You can also add Base, Ethereum, etc.
                    ],

                }}
            >
                {children}
            </PrivyProvider>
            <Toaster
                position="top-right"
                theme="dark"
                richColors
                closeButton
                offset="80px"
                toastOptions={{
                    style: {
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        boxShadow: '0 8px 32px hsl(var(--background) / 0.8)',
                    },
                }}
            />
        </QueryClientProvider>
    );
}