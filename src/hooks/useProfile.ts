import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ProfileData = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  language: string;
  avatarUrl: string;
};

const PROFILE_KEY = (userId: string) => `profile_extra_${userId}`;

/**
 * Loads & saves user profile data.
 *
 * Strategy:
 * - display_name (first + last) and avatar_url → Supabase `profiles` table + `auth.updateUser`
 * - phone / gender / language → localStorage (keyed by user id) as the DB schema doesn't have those columns
 * - avatar file → Supabase Storage "avatars" bucket (fallback: localStorage data URL)
 */
export function useProfile() {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    phone: "",
    gender: "male",
    language: "en",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const isMockUser = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        let profileRow = null;

        if (!isMockUser) {
          // 1. Load from Supabase profiles table
          const { data, error: dbErr } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", user.id)
            .maybeSingle();

          if (dbErr) console.warn("Profile load error:", dbErr.message);
          profileRow = data;
        }

        // 2. Parse display name into first / last
        const displayName =
          profileRow?.display_name ||
          (user.user_metadata?.full_name as string) ||
          "";
        const parts = displayName.trim().split(/\s+/);
        const firstName = parts[0] ?? "";
        const lastName = parts.slice(1).join(" ");

        // 3. Load extra fields from localStorage
        const extra = JSON.parse(
          localStorage.getItem(PROFILE_KEY(user.id)) ?? "{}",
        );

        setData({
          firstName,
          lastName,
          phone: extra.phone ?? "",
          gender: extra.gender ?? "male",
          language: extra.language ?? "en",
          avatarUrl: profileRow?.avatar_url ?? extra.avatarUrl ?? "",
        });
      } catch (e) {
        setError("Failed to load profile.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = useCallback(
    async (
      payload: ProfileData & { avatarFile?: File },
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Not logged in." };
      setSaving(true);
      setError(null);
      try {
        let avatarUrl = payload.avatarUrl;
        const isMockUser = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

        // Upload avatar file if provided
        if (payload.avatarFile) {
          if (isMockUser) {
            // Store as data URL in localStorage directly for mock user
            avatarUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(payload.avatarFile!);
            });
          } else {
            const ext = payload.avatarFile.name.split(".").pop() ?? "jpg";
            const path = `${user.id}/avatar.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("avatars")
              .upload(path, payload.avatarFile, { upsert: true });

            if (upErr) {
              // Fallback: store as data URL in localStorage
              console.warn("Avatar upload failed, using dataURL fallback:", upErr.message);
              avatarUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(payload.avatarFile!);
              });
            } else {
              const { data: urlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(path);
              avatarUrl = urlData.publicUrl;
            }
          }
        }

        // Save display_name + avatar_url to profiles table if not a mock user
        const displayName =
          `${payload.firstName} ${payload.lastName}`.trim();
        
        if (!isMockUser) {
          const { error: upsertErr } = await supabase.from("profiles").upsert(
            { user_id: user.id, display_name: displayName, avatar_url: avatarUrl },
            { onConflict: "user_id" },
          );
          if (upsertErr) throw upsertErr;
        }

        // Persist extra fields to localStorage
        const extra = {
          phone: payload.phone,
          gender: payload.gender,
          language: payload.language,
          avatarUrl,
        };
        localStorage.setItem(PROFILE_KEY(user.id), JSON.stringify(extra));

        // Update name in local rbac_users and session if they are a mock user
        if (isMockUser) {
          try {
            const mockSessionStr = localStorage.getItem("mock_session");
            if (mockSessionStr) {
              const mock = JSON.parse(mockSessionStr);
              if (mock.email === user.email) {
                mock.name = displayName;
                localStorage.setItem("mock_session", JSON.stringify(mock));
              }
            }

            const localUsersStr = localStorage.getItem("rbac_users");
            if (localUsersStr) {
              const localUsers = JSON.parse(localUsersStr);
              if (Array.isArray(localUsers)) {
                const updated = (localUsers as { email: string; [key: string]: unknown }[]).map((u) =>
                  u.email === user.email ? { ...u, name: displayName } : u
                );
                localStorage.setItem("rbac_users", JSON.stringify(updated));
              }
            }
          } catch (e) {
            console.error("Failed to update local user info:", e);
          }
        }

        setData({ ...payload, avatarUrl });
        return { ok: true };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Save failed.";
        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  return { data, setData, loading, saving, error, save };
}
