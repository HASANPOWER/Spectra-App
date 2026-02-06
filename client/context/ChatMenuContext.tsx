import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatMenuContextType {
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  onClearHistory: (() => void) | null;
  setOnClearHistory: (fn: (() => void) | null) => void;
  onBlockUser: (() => void) | null;
  setOnBlockUser: (fn: (() => void) | null) => void;
}

const ChatMenuContext = createContext<ChatMenuContextType | undefined>(undefined);

export function ChatMenuProvider({ children }: { children: ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);
  const [onClearHistory, setOnClearHistory] = useState<(() => void) | null>(null);
  const [onBlockUser, setOnBlockUser] = useState<(() => void) | null>(null);

  return (
    <ChatMenuContext.Provider
      value={{
        showMenu,
        setShowMenu,
        onClearHistory,
        setOnClearHistory: (fn) => setOnClearHistory(() => fn),
        onBlockUser,
        setOnBlockUser: (fn) => setOnBlockUser(() => fn),
      }}
    >
      {children}
    </ChatMenuContext.Provider>
  );
}

export function useChatMenu() {
  const context = useContext(ChatMenuContext);
  if (context === undefined) {
    throw new Error("useChatMenu must be used within a ChatMenuProvider");
  }
  return context;
}
