import { SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClerkAuthProps {
  onAuthSuccess: (userId: string, username: string) => void;
}

export const ClerkAuth = ({ onAuthSuccess }: ClerkAuthProps) => {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      const username = user.username || user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0] || 'User';
      onAuthSuccess(user.id, username);
    }
  }, [isSignedIn, user, onAuthSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">SafeYou Chat</h1>
          <p className="text-muted-foreground">Secure messaging for everyone</p>
        </div>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <SignIn 
              routing="hash"
              signUpUrl="#signup"
              afterSignInUrl="/"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0"
                }
              }}
            />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignUp 
              routing="hash"
              signInUrl="#signin"
              afterSignUpUrl="/"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0"
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
