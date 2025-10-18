import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Legacy Flutterwave billing route — canonical path is /subscribe (Paypack + manual). */
const BillingPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/subscribe", { replace: true });
  }, [navigate]);
  return (
    <div className="min-h-screen sella-hero-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
};

export default BillingPage;
