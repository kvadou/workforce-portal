"use client";

import { useState } from "react";
import {
  CalendarDaysIcon,
  MegaphoneIcon,
  BookOpenIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize";

type AnnouncementType = "IMPORTANT_DATE" | "ANNOUNCEMENT" | "STORY_SPOTLIGHT" | "TUTOR_REVIEW";
type FilterType = "all" | AnnouncementType;

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  imageUrl: string | null;
  linkUrl: string | null;
  linkText: string | null;
  isPinned: boolean;
  publishDate: Date;
  isActive: boolean;
}

interface Props {
  announcements: Announcement[];
  currentMonth: string;
}

const filterTabs: { id: FilterType; label: string; icon: React.ReactNode; bgColor: string; activeColor: string }[] = [
  { id: "IMPORTANT_DATE", label: "Important Dates", icon: <CalendarDaysIcon className="h-4 w-4" />, bgColor: "bg-primary-500", activeColor: "bg-primary-600" },
  { id: "ANNOUNCEMENT", label: "Announcements", icon: <MegaphoneIcon className="h-4 w-4" />, bgColor: "bg-accent-green", activeColor: "bg-success-dark" },
  { id: "STORY_SPOTLIGHT", label: "Story Spotlights", icon: <BookOpenIcon className="h-4 w-4" />, bgColor: "bg-accent-orange", activeColor: "bg-warning-dark" },
  { id: "TUTOR_REVIEW", label: "Tutor Reviews", icon: <StarIcon className="h-4 w-4" />, bgColor: "bg-accent-cyan", activeColor: "bg-info-dark" },
];

export function AnnouncementFeedPage({ announcements, currentMonth }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Filter announcements based on active tab
  const filteredAnnouncements = activeFilter === "all"
    ? announcements
    : announcements.filter((a) => a.type === activeFilter);

  // Group announcements by type for display
  const importantDates = announcements.filter((a) => a.type === "IMPORTANT_DATE");
  const regularAnnouncements = announcements.filter((a) => a.type === "ANNOUNCEMENT");
  const storySpotlights = announcements.filter((a) => a.type === "STORY_SPOTLIGHT");
  const tutorReviews = announcements.filter((a) => a.type === "TUTOR_REVIEW");

  return (
    <>
      {/* Hero Banner with Rolling Hills Background */}
      <div
        className="relative overflow-hidden bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url('/images/hero-banner.jpg')",
          backgroundPosition: "center 25%",
          minHeight: "260px"
        }}
      >
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-white/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold italic text-primary-700 drop-shadow-md">
              Welcome to Acme Workforce!
            </h1>
          </div>
        </div>

        {/* Bottom fade to page background */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-accent-light to-transparent" />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Month Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-700 mb-8">
          {currentMonth}
        </h2>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(activeFilter === tab.id ? "all" : tab.id)}
              className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
                activeFilter === tab.id
                  ? `${tab.activeColor} shadow-sm ring-2 ring-offset-2 ring-neutral-300`
                  : `${tab.bgColor} hover:opacity-90 shadow`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conditional Rendering Based on Filter */}
        {activeFilter === "all" ? (
          // Show all sections
          <div className="space-y-12">
            {/* Important Dates Section */}
            {importantDates.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-primary-600 mb-4 flex items-center gap-2">
                  <CalendarDaysIcon className="h-6 w-6" />
                  Important Dates!
                </h3>
                <div className="space-y-3">
                  {importantDates.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
                      <div className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1">•</span>
                        <div>
                          <span className="font-semibold text-neutral-900">{item.title}</span>
                          {item.content && (
                            <span className="text-neutral-600"> – {item.content}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Announcements Section */}
            {regularAnnouncements.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-primary-600 mb-4 flex items-center gap-2">
                  <MegaphoneIcon className="h-6 w-6" />
                  What&apos;s Happening in Chesslandia??
                </h3>
                <div className="space-y-6">
                  {regularAnnouncements.map((item) => (
                    <AnnouncementCard key={item.id} announcement={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Story Spotlights Section */}
            {storySpotlights.length > 0 && (
              <section className="border-t border-neutral-200 pt-10">
                <h3 className="text-2xl font-bold text-primary-600 mb-4 flex items-center gap-2">
                  <BookOpenIcon className="h-6 w-6" />
                  Story Spotlights
                </h3>
                <div className="space-y-6">
                  {storySpotlights.map((item) => (
                    <SpotlightCard key={item.id} announcement={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Tutor Reviews Section */}
            {tutorReviews.length > 0 && (
              <section className="border-t border-neutral-200 pt-10">
                <h3 className="text-2xl font-bold text-primary-600 mb-4 flex items-center gap-2">
                  <StarIcon className="h-6 w-6" />
                  Tutor Reviews!
                </h3>
                <p className="text-neutral-600 mb-6">
                  Time to celebrate the amazing impact you&apos;re having on our families!
                </p>
                <div className="space-y-6">
                  {tutorReviews.map((item) => (
                    <ReviewCard key={item.id} announcement={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          // Show filtered content
          <div className="space-y-6">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((item) => {
                if (item.type === "IMPORTANT_DATE") {
                  return (
                    <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                      <div className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1">•</span>
                        <div>
                          <span className="font-semibold text-neutral-900">{item.title}</span>
                          {item.content && (
                            <span className="text-neutral-600"> – {item.content}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (item.type === "TUTOR_REVIEW") {
                  return <ReviewCard key={item.id} announcement={item} />;
                }
                if (item.type === "STORY_SPOTLIGHT") {
                  return <SpotlightCard key={item.id} announcement={item} />;
                }
                return <AnnouncementCard key={item.id} announcement={item} />;
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-neutral-200">
                <p className="text-neutral-500">No {filterTabs.find(t => t.id === activeFilter)?.label.toLowerCase()} at this time.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {announcements.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-neutral-200">
            <MegaphoneIcon className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No announcements yet</h3>
            <p className="text-neutral-500">Check back soon for updates from Acme Workforce!</p>
          </div>
        )}
      </main>
    </>
  );
}

// Announcement Card Component
function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-200">
      <div className="p-6">
        <h4 className="text-xl font-bold text-neutral-900 mb-3">{announcement.title}</h4>
        {announcement.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-full h-auto"
            />
          </div>
        )}
        <div
          className="prose prose-neutral max-w-none text-neutral-700"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.content) }}
        />
        {announcement.linkUrl && (
          <div className="mt-4">
            <Link
              href={announcement.linkUrl}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              {announcement.linkText || "Learn more"} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Story Spotlight Card Component
function SpotlightCard({ announcement }: { announcement: Announcement }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-200">
      <div className="p-6">
        <h4 className="text-xl font-bold text-neutral-900 mb-3">{announcement.title}</h4>
        {announcement.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-full h-auto max-w-md"
            />
          </div>
        )}
        <div
          className="prose prose-neutral max-w-none text-neutral-700"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.content) }}
        />
        {announcement.linkUrl && (
          <div className="mt-4">
            <Link
              href={announcement.linkUrl}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {announcement.linkText || "Check it out"} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Review Card Component
function ReviewCard({ announcement }: { announcement: Announcement }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} className="h-5 w-5 fill-accent-yellow text-accent-yellow" />
        ))}
      </div>
      <blockquote className="text-lg italic text-neutral-700 mb-3">
        &ldquo;{announcement.content}&rdquo;
      </blockquote>
      <p className="text-neutral-500">{announcement.title}</p>
    </div>
  );
}
