import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";

interface UserProfileValue {
  displayName: string;
  avatarSrc: string;
  setDisplayName: (name: string) => void;
  setAvatarSrc: (src: string) => void;
}

const UserProfileCtx = createContext<UserProfileValue | null>(null);

export function useUserProfile() {
  const c = useContext(UserProfileCtx);
  if (!c) throw new Error("Missing UserProfileProvider");
  return c;
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Derive initial name from auth user metadata, fallback to email, then default
  const authName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "User";

  const authAvatar =
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture ??
    "/images/avatar.png";

  const [displayName, setDisplayName] = useState(authName);
  const [avatarSrc, setAvatarSrc] = useState(authAvatar);

  // Sync when auth user changes (login/logout/profile update)
  useEffect(() => {
    setDisplayName(authName);
    setAvatarSrc(authAvatar);
  }, [authName, authAvatar]);

  return (
    <UserProfileCtx.Provider value={{ displayName, avatarSrc, setDisplayName, setAvatarSrc }}>
      {children}
    </UserProfileCtx.Provider>
  );
}
