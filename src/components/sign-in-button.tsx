"use client";

import { authClient } from "~/server/better-auth/client";
import { useState } from "react";

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // Use relative path - better-auth will construct full URL from baseURL
      const res = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });

      // Handle redirect if URL is provided
      if (res && typeof res === "object" && "url" in res) {
        const url = res.url as string | undefined;
        if (url) {
          window.location.href = url;
          return; // Don't set loading to false, we're redirecting
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20 disabled:opacity-50"
    >
      {isLoading ? "Signing in..." : "Sign in with GitHub"}
    </button>
  );
}
