"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  type AdminSection,
  type SectionConfig,
  getSectionFromPath,
  getSectionConfig,
  isNavGroup,
} from "./sectionConfigs";

interface AdminLayoutContextValue {
  currentSection: AdminSection;
  sectionConfig: SectionConfig;
  isActive: (href: string) => boolean;
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

export function AdminLayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const value = useMemo<AdminLayoutContextValue>(() => {
    const currentSection = getSectionFromPath(pathname);
    const sectionConfig = getSectionConfig(currentSection);

    // Collect all sidebar hrefs for most-specific-match logic
    const allHrefs: string[] = [];
    for (const item of sectionConfig.sidebarItems) {
      if (isNavGroup(item)) {
        for (const sub of item.items) allHrefs.push(sub.href);
      } else {
        allHrefs.push(item.href);
      }
    }

    const isActive = (href: string) => {
      // Exact match always wins
      if (pathname === href) return true;
      // Prefix match — but only if no longer (more specific) sibling also matches
      if (href !== "/admin" && pathname.startsWith(href + "/")) {
        const hasMoreSpecific = allHrefs.some(
          (other) =>
            other !== href &&
            other.length > href.length &&
            (pathname === other || pathname.startsWith(other + "/"))
        );
        return !hasMoreSpecific;
      }
      return false;
    };

    return { currentSection, sectionConfig, isActive };
  }, [pathname]);

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext);
  if (!ctx) throw new Error("useAdminLayout must be used within AdminLayoutProvider");
  return ctx;
}
