"use client";

import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/icon-button";
import { useAdminLayout } from "./AdminLayoutProvider";
import { isNavGroup } from "./sectionConfigs";

interface AdminSectionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSectionSidebar({ isOpen, onClose }: AdminSectionSidebarProps) {
  const { sectionConfig, isActive } = useAdminLayout();

  // No sidebar for sections without items (Home/Dashboard)
  if (sectionConfig.sidebarItems.length === 0) return null;

  const SectionIcon = sectionConfig.icon;

  const sidebarContent = (
    <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <SectionIcon className="h-5 w-5 text-primary-600" />
          <span className="font-semibold text-neutral-900">{sectionConfig.name}</span>
        </div>
        {/* Mobile close */}
        <IconButton
          icon={XMarkIcon}
          size="sm"
          aria-label="Close sidebar"
          onClick={onClose}
          className="lg:hidden"
        />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sectionConfig.sidebarItems.map((item, idx) => {
          if (isNavGroup(item)) {
            return (
              <div key={item.groupName} className={idx > 0 ? "pt-4" : ""}>
                <p className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  {item.groupName}
                </p>
                <ul className="space-y-1">
                  {item.items.map((sub) => {
                    const SubIcon = sub.icon;
                    const active = isActive(sub.href);
                    return (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3 h-11 rounded-[10px] text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                            active
                              ? "bg-primary-50 text-primary-500 font-medium border-l-[3px] border-primary-500 pl-[9px] px-3 py-2.5"
                              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 px-3 py-2.5"
                          }`}
                        >
                          <SubIcon className={`h-5 w-5 flex-shrink-0 ${active ? "text-primary-500" : "text-neutral-400"}`} />
                          {sub.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          }

          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 h-11 rounded-[10px] text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                active
                  ? "bg-primary-50 text-primary-500 font-medium border-l-[3px] border-primary-500 pl-[9px] px-3 py-2.5"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 px-3 py-2.5"
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-primary-500" : "text-neutral-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:block flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="absolute left-0 top-0 h-full animate-slide-in-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
