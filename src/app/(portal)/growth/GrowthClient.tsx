"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FlagIcon, SparklesIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { AchievementsTab } from "./AchievementsTab";
import { GoalsTab } from "./GoalsTab";
import { LeaderboardTab } from "./LeaderboardTab";

const tabs = [
  { key: "achievements", label: "Achievements", icon: TrophyIcon },
  { key: "goals", label: "Goals", icon: FlagIcon },
  { key: "leaderboard", label: "Leaderboard", icon: TrophyIcon },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function GrowthClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get("tab");
  const activeTab: TabKey =
    rawTab === "goals" || rawTab === "leaderboard" ? rawTab : "achievements";

  const setTab = (tab: TabKey) => {
    const url = tab === "achievements" ? "/growth" : `/growth?tab=${tab}`;
    router.replace(url);
  };

  return (
    <DashboardLayout>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <PortalPageHeader
        icon={SparklesIcon}
        title="Growth"
        description="Earn achievements, crush goals, and climb the ranks"
        colorScheme="rose"
        flush
      />

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 px-4 sm:px-6 pt-4 sm:pt-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex-1 justify-center min-h-[44px] ${
                isActive
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Active Tab Content */}
      {activeTab === "achievements" && <AchievementsTab />}
      {activeTab === "goals" && <GoalsTab />}
      {activeTab === "leaderboard" && <LeaderboardTab />}
      </div>
      </div>
    </DashboardLayout>
  );
}
