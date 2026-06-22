"use client";

import { AuthScreen } from "@/component/AuthScreen";
import { createSupabaseClient } from "@/lib/supabaseClient";

export const SignInClient = () => {
  const handleGoogleSignIn = async () => {
    const supabase = createSupabaseClient();
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return <AuthScreen defaultView="login" onSocialSignIn={handleGoogleSignIn} />;
};