import { useEffect } from "react";
import { ClerkAuth } from "@/components/ClerkAuth";

const Auth = () => {
  useEffect(() => {
    document.title = "Sign In | SafeYou Chat";
  }, []);

  return <ClerkAuth onAuthSuccess={() => {}} />;
};

export default Auth;
