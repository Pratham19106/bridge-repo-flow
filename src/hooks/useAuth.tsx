import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"user" | "official" | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async (userId: string) => {
      try {
        const { data: roles, error } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .limit(2);

        if (error) {
          console.error("Error fetching role:", error);
          return null;
        }

        // Prioritize official role if user has multiple roles
        return roles?.find((r: any) => r.role === "official")?.role || roles?.[0]?.role || null;
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        return null;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          if (mounted) setUserRole(role);
        } else {
          if (mounted) setUserRole(null);
        }
        
        if (mounted) setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        if (mounted) setUserRole(role);
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    navigate("/auth");
  };

  return { user, session, loading, userRole, signOut };
};
