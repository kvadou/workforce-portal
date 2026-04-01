import { SiteHeader } from "@/components/portal/SiteHeader";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-accent-light">
      <SiteHeader />
      {children}
    </div>
  );
}
