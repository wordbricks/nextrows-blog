"use client";

import { createContext, useContext, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  openPalette: () => void;
  closePalette: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPalette = () => {
    // Ensure we don't have conflicting state updates
    setOpen(true);
  };
  const closePalette = () => {
    setOpen(false);
  };
  const isEditableTarget = (t: EventTarget | null) => {
    if (!(t instanceof HTMLElement)) return false;
    const tag = t.tagName;
    if (tag === "INPUT") return true;
    if (tag === "TEXTAREA") return true;
    if (t.isContentEditable) return true;
    const role = t.getAttribute("role");
    if (role === "textbox") return true;
    return false;
  };
  useHotkeys(
    "mod+k",
    (e) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setOpen(true);
    },
    { preventDefault: true },
  );
  useHotkeys(
    "esc",
    (e) => {
      if (!open) return;
      e.preventDefault();
      setOpen(false);
    },
    { preventDefault: true },
  );
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, openPalette, closePalette }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (ctx === null) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}
