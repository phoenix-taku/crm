"use client";

import { authClient } from "~/server/better-auth/client";

export function SignInButton() {
  const handleSignIn = async () => {
    try {
      const res = await authClient.signIn.social({
        provider: "github",
        callbackURL: window.location.origin + "/",
      });

      if (res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
    >
      Sign in with GitHub
    </button>
  );
}
