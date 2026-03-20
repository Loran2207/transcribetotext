import { createContext, useContext, useState } from "react";

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
  const [displayName, setDisplayName] = useState("Kirill Kuts");
  const [avatarSrc, setAvatarSrc] = useState("/images/avatar.png");

  return (
    <UserProfileCtx.Provider value={{ displayName, avatarSrc, setDisplayName, setAvatarSrc }}>
      {children}
    </UserProfileCtx.Provider>
  );
}
