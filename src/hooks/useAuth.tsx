import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadRole = async (user: User | null) => {
      if (!user) {
        if (active) setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) setIsAdmin(Boolean(data));
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      void loadRole(next?.user ?? null);
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadRole(data.session?.user ?? null);
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, isAdmin, loading };
}