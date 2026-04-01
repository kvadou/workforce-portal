import { Suspense } from "react";
import { Metadata } from "next";
import { GrowthClient } from "./GrowthClient";

export const metadata: Metadata = {
  title: "Growth | Acme Workforce",
  description: "Earn achievements, crush goals, and climb the ranks",
};

export default function GrowthPage() {
  return (
    <Suspense>
      <GrowthClient />
    </Suspense>
  );
}
