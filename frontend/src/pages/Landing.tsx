import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) navigate("/hoje", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-xl space-y-6">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orbis-blue-tint bg-orbis-blue-tint">
            <span className="text-2xl font-bold text-orbis-blue">O</span>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Orbis</h1>
          <p className="text-muted-foreground">
            Organize o seu dia para que você possa focar no seu trabalho.
          </p>
        </div>
        <div className="flex justify-center">
          <Button asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}