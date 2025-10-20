import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";

/**
 * Cloud sign-in is phone + 4-digit PIN (derived Auth password).
 * Generic email password reset would break PIN login — guide users instead.
 */
const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen sella-hero-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm glass-card p-6 space-y-4 text-center">
        <BrandMark variant="icon" size="md" />
        <h1 className="text-lg font-bold">Forgot PIN?</h1>
        <p className="text-sm text-muted-foreground text-left">
          Sella signs you in with your <strong>phone number</strong> and{" "}
          <strong>4-digit PIN</strong> — not an email password.
        </p>
        <ul className="text-sm text-muted-foreground text-left list-disc pl-5 space-y-1">
          <li>Open the app and dial your PIN on the unlock screen.</li>
          <li>
            If you are already signed in, go to <strong>Account → Hindura PIN</strong> to
            change it.
          </li>
          <li>
            If you lost your PIN and cannot open the shop, contact support with your shop
            email and shop code.
          </li>
        </ul>
        <Link to="/" className="text-sm text-primary inline-block pt-2">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
