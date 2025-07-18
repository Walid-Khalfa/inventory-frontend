// app/components/theme-provider.js
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  // Only runs on client after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR (before hydration), render children without theme provider
  if (!mounted) {
    return <div style={{ display: 'contents' }}>{children}</div>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme-preference"
      themes={['light', 'dark', 'system']}
    >
      {children}
    </NextThemesProvider>
  );
}