"use client";

import { useState } from "react";
import {
  Cog6ToothIcon,
  PlayCircleIcon,
  MapIcon,
  TrophyIcon,
  QuestionMarkCircleIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { GeneralSettings } from "./GeneralSettings";
import { WelcomeSettings } from "./WelcomeSettings";
import { JourneyStepsEditor } from "./JourneyStepsEditor";
import { BadgesEditor } from "./BadgesEditor";
import { TrainingVideosSettings } from "./TrainingVideosSettings";
import { QuizSettings } from "./QuizSettings";
import { OrientationSettings } from "./OrientationSettings";
import { DropdownOptionsEditor } from "./DropdownOptionsEditor";
import { IntegrationsSettings } from "./IntegrationsSettings";

type TabId =
  | "general"
  | "welcome"
  | "journey"
  | "badges"
  | "videos"
  | "quiz"
  | "orientation"
  | "dropdowns"
  | "integrations";

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "General", icon: Cog6ToothIcon },
  { id: "welcome", label: "Welcome", icon: PlayCircleIcon },
  { id: "journey", label: "Journey", icon: MapIcon },
  { id: "badges", label: "Badges", icon: TrophyIcon },
  { id: "videos", label: "Training Videos", icon: PlayCircleIcon },
  { id: "quiz", label: "Quiz", icon: QuestionMarkCircleIcon },
  { id: "orientation", label: "Orientation", icon: CalendarDaysIcon },
  { id: "dropdowns", label: "Dropdowns", icon: ListBulletIcon },
  { id: "integrations", label: "Integrations", icon: LinkIcon },
];

export function OnboardingSettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <div>
      {/* Tab Navigation — full width */}
      <div className="border-b border-neutral-200 bg-white sticky top-14 z-10 overflow-x-auto">
        <nav className="flex -mb-px px-4 sm:px-6 lg:px-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "welcome" && <WelcomeSettings />}
        {activeTab === "journey" && <JourneyStepsEditor />}
        {activeTab === "badges" && <BadgesEditor />}
        {activeTab === "videos" && <TrainingVideosSettings />}
        {activeTab === "quiz" && <QuizSettings />}
        {activeTab === "orientation" && <OrientationSettings />}
        {activeTab === "dropdowns" && <DropdownOptionsEditor />}
        {activeTab === "integrations" && <IntegrationsSettings />}
      </div>
    </div>
  );
}
