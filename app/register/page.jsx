"use client";

// Correction de l'importation avec le chemin complet
import { RegisterForm } from "@/components/ui/register-form";
import { IconBrandSketch, IconLoader2 } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading")
    return (
      <div className="flex h-screen items-center justify-center">
        <IconLoader2 className="size-10 animate-spin text-gray-500" />
      </div>
    );

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <IconBrandSketch className="size-4" />
          </div>
          Smart Inventory & POS
        </a>
        <RegisterForm />
      </div>
    </div>
  );
}
