import { usePrivy, useLogin } from '@privy-io/react-auth';
import { Button } from "@/components/ui/button";   // or your own button component

export default function LoginButton() {
    const { login } = useLogin({
        onComplete: (params) => {
            const { user, isNewUser, wasAlreadyAuthenticated, loginMethod } = params;
            console.log("Login complete!", {
                user,
                isNewUser,
                wasAlreadyAuthenticated,
                loginMethod
            });

            console.log("Login successful!", {
                user,
                isNewUser,
                wasAlreadyAuthenticated,
                loginMethod
            });
            if (isNewUser) {
                console.log("This is a new user");
            }else{
                alert(`Welcome back, ${user.email?.address || "user"}!`);
            }
        },
    });


    const { authenticated, ready, user } = usePrivy();

    if (!ready) {
        return <Button disabled>Loading...</Button>;
    }

    if (authenticated && user) {
        return (
            <Button variant="outline">
                {user.email?.address ? user.email.address : "Connected"}
            </Button>
        );
    }

    return (
        <Button onClick={login} className="font-medium">
            Connect Wallet
        </Button>
    );
}