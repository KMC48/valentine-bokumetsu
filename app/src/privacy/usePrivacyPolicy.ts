import { useCallback, useEffect, useRef, useState } from "react";
import { createPrivacyNavigation } from "./navigation";
import { listenForPrivacyBack } from "./androidBack";

export function usePrivacyPolicy() {
  const [isOpen, setOpen] = useState(false);
  const navigation = useRef<ReturnType<typeof createPrivacyNavigation> | null>(null);
  useEffect(() => {
    const current = createPrivacyNavigation(window, setOpen);
    navigation.current = current;
    return () => {
      current.dispose();
      navigation.current = null;
    };
  }, []);
  const open = useCallback(() => navigation.current?.open(), []);
  const close = useCallback(() => navigation.current?.close(), []);
  useEffect(() => {
    if (isOpen) return listenForPrivacyBack(close);
  }, [isOpen, close]);
  return { isOpen, open, close };
}
