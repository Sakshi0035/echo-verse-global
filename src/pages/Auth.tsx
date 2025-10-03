import { useEffect } from "react";
import { ClerkAuth } from "@/components/ClerkAuth";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign In | SafeYou Chat";
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      navigate("/", { replace: true });
    }
  }, [isSignedIn, navigate]);

  return (
    <ClerkAuth
      onAuthSuccess={() => {
        navigate("/", { replace: true });
      }}
    />
  );
};

export default Auth;
