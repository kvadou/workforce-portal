"use client";

import { ReactNode, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AdminLayoutProvider,
  AdminTopNav,
  AdminSectionSidebar,
  AdminSearch,
} from "@/components/admin/layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminLayoutProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top navigation */}
        <AdminTopNav
          userName={session?.user?.name}
          userImage={session?.user?.image}
          userEmail={session?.user?.email}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Content area with optional sidebar */}
        <div className="flex-1 flex">
          <AdminSectionSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Cmd+K Search modal */}
      <AdminSearch />
    </AdminLayoutProvider>
  );
}
