import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen sella-hero-bg flex flex-col items-center justify-center p-6 text-center">
      <BrandMark variant="icon" size="lg" float />
      <h1 className="text-[#0B3FCC] text-2xl font-bold mt-6">404</h1>
      <p className="text-slate-600 text-sm mt-2 max-w-xs">
        Iyi page ntibaho. Subira kuri Sella.
      </p>
      <Button asChild className="btn-gold mt-6 h-11 px-6">
        <Link to="/">Subira / Go home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
