"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RouteScrollReset() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || previousPathname.current === pathname) {
      previousPathname.current = pathname;
      return;
    }

    previousPathname.current = pathname;
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}
