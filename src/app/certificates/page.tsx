import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CertificatesClient } from "./CertificatesClient";

export const metadata = {
  title: "My Certificates | Acme Workforce",
  description: "View and download your earned certificates",
};

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <CertificatesClient />;
}
