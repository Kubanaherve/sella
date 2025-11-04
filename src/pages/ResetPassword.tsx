import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";

/** Legacy Supabase password-reset links are not used for PIN accounts. */
const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen sella-hero-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm glass-card p-6 space-y-4 text-center">
        <BrandMark variant="icon" size="md" />
        <h1 className="text-lg font-bold">Use your PIN</h1>
        <p className="text-sm text-muted-foreground">
          This link is not needed for Sella. Sign in with phone + 4-digit PIN, then change
          your PIN from Account if required.
        </p>
        <Link to="/" className="text-sm text-primary inline-block">
          ← Go to unlock
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
