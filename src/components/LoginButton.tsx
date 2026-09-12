"use client";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { LogIn } from "lucide-react";

function LoginButton() {
  const { isLoaded } = useAuth();
  // Clerk JS not ready yet (slow network / keyless boot) — don't render a
  // dead button.
  if (!isLoaded) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-blue-500/50 text-white/70 rounded-lg
             font-medium"
      >
        <LogIn className="w-4 h-4 transition-transform" />
        <span>Sign In</span>
      </button>
    );
  }
  return (
    <SignInButton mode="modal">
      <button
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg
             transition-all duration-200 font-medium shadow-lg shadow-blue-500/20"
      >
        <LogIn className="w-4 h-4 transition-transform" />
        <span>Sign In</span>
      </button>
    </SignInButton>
  );
}
export default LoginButton;
