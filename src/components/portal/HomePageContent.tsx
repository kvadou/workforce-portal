"use client";

import { useState, useCallback } from "react";
import {
  CalendarDaysIcon,
  MegaphoneIcon,
  BookOpenIcon,
  StarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  TrophyIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { CMSWrapper } from "@/components/cms/CMSWrapper";
import { CMSPageRenderer } from "@/components/cms/CMSPageRenderer";
import { useCMS, CMSBlock } from "@/providers/CMSProvider";
import { buildInitialHomeCMSBlocks } from "./home-cms-initializer";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize";

type AnnouncementType = "IMPORTANT_DATE" | "ANNOUNCEMENT" | "STORY_SPOTLIGHT" | "TUTOR_REVIEW";

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

interface HomePageContentProps {
  announcements: Announcement[];
  currentMonth: string;
}

// Inner component that has access to CMS context
function HomePageInner({ announcements, currentMonth }: HomePageContentProps) {
  const { isAdmin, editMode, blocks, setBlocks, isLoading, hasInitialized, currentPageType, currentPageId, setOriginalBlocks, setHasUnsavedChanges, markPageLoaded } = useCMS();
  const [isInitializing, setIsInitializing] = useState(false);

  // Group announcements by type
  const importantDates = announcements.filter((a) => a.type === "IMPORTANT_DATE");
  const regularAnnouncements = announcements.filter((a) => a.type === "ANNOUNCEMENT");
  const storySpotlights = announcements.filter((a) => a.type === "STORY_SPOTLIGHT");
  const tutorReviews = announcements.filter((a) => a.type === "TUTOR_REVIEW");

  // Generate a unique ID for blocks
  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Convert existing announcements to CMS blocks
  const initializeFromAnnouncements = useCallback(async () => {
    setIsInitializing(true);
    const newBlocks: CMSBlock[] = buildInitialHomeCMSBlocks({
      importantDates,
      regularAnnouncements,
      storySpotlights,
      tutorReviews,
      currentMonth,
      generateId,
    });

    // Set blocks in local state
    setBlocks(newBlocks);
    setOriginalBlocks(newBlocks);

    // Mark page as loaded to prevent loadContent from re-fetching
    if (currentPageType && currentPageId) {
      markPageLoaded(currentPageType, currentPageId);
    }

    // Save to database immediately so it persists
    try {
      const response = await fetch(
        `/api/cms/content/${currentPageType}/${currentPageId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks: newBlocks, action: "draft" }),
        }
      );

      if (response.ok) {
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Failed to save initial blocks:", error);
    }

    setIsInitializing(false);
  }, [importantDates, regularAnnouncements, storySpotlights, tutorReviews, currentMonth, setBlocks, setOriginalBlocks, currentPageType, currentPageId, setHasUnsavedChanges, markPageLoaded]);

  // Show CMS-driven content if blocks exist
  const hasCMSContent = blocks.length > 0;

  // Loading state - show until first load completes
  if (!hasInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="h-80 bg-white/5 rounded-3xl mb-8 animate-pulse backdrop-blur-sm"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse backdrop-blur-sm" style={{ animationDelay: `${i * 100}ms` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If CMS content exists, render fully from CMS
  if (hasCMSContent) {
    return (
      <div className="min-h-screen">
        <CMSPageRenderer
          pageType="home"
          pageId="main"
          className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-6 sm:pb-8"
        />
      </div>
    );
  }

  // No CMS content yet - show default view with option to initialize

  // Quick navigation sections
  const navSections = [
    { id: 'dates', label: 'Important Dates', icon: CalendarDaysIcon, gradient: 'from-error to-accent-pink', bgGlow: 'shadow-error/25', count: importantDates.length, show: importantDates.length > 0 },
    { id: 'announcements', label: 'Announcements', icon: MegaphoneIcon, gradient: 'from-success-light to-success', bgGlow: 'shadow-success/25', count: regularAnnouncements.length, show: regularAnnouncements.length > 0 },
    { id: 'spotlights', label: 'Story Spotlights', icon: BookOpenIcon, gradient: 'from-warning-light to-accent-orange', bgGlow: 'shadow-warning/25', count: storySpotlights.length, show: storySpotlights.length > 0 },
    { id: 'reviews', label: 'Tutor Reviews', icon: StarIcon, gradient: 'from-primary-500 to-primary-600', bgGlow: 'shadow-primary-500/25', count: tutorReviews.length, show: tutorReviews.length > 0 },
  ].filter(s => s.show);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* === HERO SECTION === */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-navy via-primary-600 to-accent-pink">
          {/* Animated orbs */}
          <div className="absolute top-0 left-1/4 h-96 w-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 bg-accent-pink/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-navy/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        {/* Chess piece decorations */}
        <div className="absolute left-4 bottom-16 opacity-20">
          <TrophyIcon className="h-24 w-24 md:w-32 md:h-32 text-white" />
        </div>
        <div className="absolute right-4 bottom-16 opacity-20">
          <StarIcon className="h-24 w-24 md:w-32 md:h-32 text-white" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full border border-white/20 mb-6 animate-fade-in">
              <TrophyIcon className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-white/90">Your Tutor Command Center</span>
              <SparklesIcon className="h-4 w-4 text-warning" />
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight">
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.1s' }}>Welcome to</span>
              <br />
              <span className="inline-block bg-gradient-to-r from-warning-light via-warning to-warning-light bg-clip-text text-transparent animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Acme Workforce
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              Everything you need to deliver magical chess lessons.
              Resources, announcements, and community - all in one place.
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-3 md:gap-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              {navSections.slice(0, 4).map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="group flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2.5 md:py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
                >
                  <div className={`h-8 w-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm ${section.bgGlow}`}>
                    <section.icon className="h-4 w-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xl md:text-2xl font-bold text-white">{section.count}</div>
                    <div className="text-[10px] md:text-xs text-white/60 font-medium truncate">{section.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </div>

      {/* Admin: Convert to CMS prompt */}
      {isAdmin && editMode && (
        <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-20">
          <div className="bg-gradient-to-r from-accent-navy-light via-primary-50 to-accent-pink-light border-2 border-dashed border-accent-navy rounded-2xl p-6 text-center shadow-sm">
            <SparklesIcon className="h-10 w-10 mx-auto mb-3 text-accent-navy" />
            <h3 className="text-lg font-semibold text-accent-navy mb-2">
              Make This Page Editable
            </h3>
            <p className="text-neutral-600 mb-4 max-w-lg mx-auto">
              Convert all existing content into CMS blocks so you can edit everything directly.
            </p>
            <Button
              variant="primary"
              onClick={initializeFromAnnouncements}
              disabled={isInitializing}
              className="min-w-[200px]"
            >
              {isInitializing ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Converting...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Convert to CMS Blocks
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Month Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-accent-navy to-accent-navy" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-accent-navy via-primary-600 to-accent-pink bg-clip-text text-transparent">
                {currentMonth}
              </h2>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-24 bg-gradient-to-r from-accent-navy-light to-accent-pink rounded-full" />
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-accent-pink to-accent-pink" />
          </div>
          <p className="mt-6 text-neutral-500 font-medium">Your monthly updates and announcements</p>
        </div>

        {/* === BENTO GRID LAYOUT === */}
        <div className="space-y-8">
          {/* Important Dates - Full width timeline */}
          {importantDates.length > 0 && (
            <section id="dates" className="scroll-mt-24">
              <div className="bg-white rounded-3xl shadow-sm shadow-error-light/50 border border-error overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-error via-accent-pink to-error px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <CalendarDaysIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Important Dates</h3>
                      <p className="text-error text-sm">Mark your calendar for these key events</p>
                    </div>
                    <div className="ml-auto">
                      <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-semibold">
                        {importantDates.length} {importantDates.length === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline items */}
                <div className="divide-y divide-error-light">
                  {importantDates.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-5 px-6 py-5 hover:bg-gradient-to-r hover:from-error-light/50 hover:to-transparent transition-all duration-300 group"
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center pt-1 flex-shrink-0">
                        <div className="relative">
                          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-error to-accent-pink shadow-sm shadow-error-light group-hover:scale-125 transition-transform" />
                          <div className="absolute inset-0 rounded-full bg-error animate-ping opacity-20" />
                        </div>
                        {index < importantDates.length - 1 && (
                          <div className="w-0.5 h-full min-h-[40px] bg-gradient-to-b from-error-light to-transparent mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-neutral-900 group-hover:text-error transition-colors">
                          {item.title}
                        </h4>
                        {item.content && (
                          <p className="text-neutral-600 mt-1 leading-relaxed">
                            {item.content}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRightIcon className="h-5 w-5 text-error group-hover:text-error group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Two column layout for announcements and spotlights */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Announcements */}
            {regularAnnouncements.length > 0 && (
              <section id="announcements" className="scroll-mt-24 space-y-6">
                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-success-light to-success flex items-center justify-center shadow-sm shadow-success-light/50">
                    <MegaphoneIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900">What&apos;s New</h3>
                    <p className="text-sm text-neutral-500">Latest updates from Chesslandia</p>
                  </div>
                </div>

                {/* Announcement cards */}
                <div className="space-y-5">
                  {regularAnnouncements.map((item, index) => (
                    <AnnouncementCard
                      key={item.id}
                      announcement={item}
                      isAdmin={isAdmin && editMode}
                      isFirst={index === 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Story Spotlights */}
            {storySpotlights.length > 0 && (
              <section id="spotlights" className="scroll-mt-24 space-y-6">
                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-warning-light to-accent-orange flex items-center justify-center shadow-sm shadow-warning-light/50">
                    <BookOpenIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900">Story Spotlights</h3>
                    <p className="text-sm text-neutral-500">Featured lessons and adventures</p>
                  </div>
                </div>

                {/* Spotlight cards */}
                <div className="space-y-5">
                  {storySpotlights.map((item) => (
                    <SpotlightCard key={item.id} announcement={item} isAdmin={isAdmin && editMode} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Tutor Reviews - Masonry style */}
          {tutorReviews.length > 0 && (
            <section id="reviews" className="scroll-mt-24">
              {/* Section header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm shadow-primary-200/50">
                    <StarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900">Tutor Spotlight</h3>
                    <p className="text-sm text-neutral-500">Celebrating your amazing impact!</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-primary-500" />
                  <span className="text-sm font-semibold text-primary-700">{tutorReviews.length} Reviews</span>
                </div>
              </div>

              {/* Reviews grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tutorReviews.map((item, index) => (
                  <ReviewCard
                    key={item.id}
                    announcement={item}
                    isAdmin={isAdmin && editMode}
                    colorIndex={index}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Empty State */}
        {announcements.length === 0 && !isAdmin && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-neutral-100">
            <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-navy-light to-primary-100 flex items-center justify-center">
              <BoltIcon className="h-10 w-10 text-accent-navy" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">All Caught Up!</h3>
            <p className="text-neutral-500 max-w-md mx-auto">
              No new announcements right now. Check back soon for updates from Acme Workforce!
            </p>
          </div>
        )}
      </main>

      {/* Styles for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-slide-up {
          opacity: 0;
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export function HomePageContent({ announcements, currentMonth }: HomePageContentProps) {
  return (
    <CMSWrapper pageType="home" pageId="main">
      <HomePageInner announcements={announcements} currentMonth={currentMonth} />
    </CMSWrapper>
  );
}

// === ANNOUNCEMENT CARD ===
function AnnouncementCard({ announcement, isAdmin, isFirst }: { announcement: Announcement; isAdmin: boolean; isFirst?: boolean }) {
  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 group
      ${isFirst
        ? 'shadow-sm shadow-success-light/50 border-success hover:shadow-card-hover hover:shadow-success-light/50'
        : 'shadow-sm border-neutral-100 hover:shadow-card-hover hover:border-success'
      }`}>
      {/* Featured badge for first item */}
      {isFirst && (
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-success text-white text-xs font-bold rounded-full shadow-sm">
            <BoltIcon className="h-3 w-3" />
            FEATURED
          </span>
        </div>
      )}

      {isAdmin && (
        <Link
          href={`/admin/announcements/${announcement.id}`}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm hover:bg-success-light rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10 border border-neutral-100"
          title="Edit announcement"
        >
          <Cog6ToothIcon className="h-4 w-4 text-neutral-600" />
        </Link>
      )}

      {/* Image */}
      {announcement.imageUrl && (
        <div className="relative overflow-hidden aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className={`p-6 ${isFirst ? 'bg-gradient-to-br from-white to-success-light/30' : ''}`}>
        <h4 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-success transition-colors line-clamp-2">
          {announcement.title}
        </h4>
        <div
          className="prose prose-neutral prose-sm max-w-none text-neutral-600 leading-relaxed line-clamp-4"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.content) }}
        />
        {announcement.linkUrl && (
          <div className="mt-5 pt-4 border-t border-neutral-100">
            <Link
              href={announcement.linkUrl}
              className="inline-flex items-center gap-2 text-success hover:text-success-dark font-semibold text-sm group/link"
            >
              <span>{announcement.linkText || "Read more"}</span>
              <ArrowRightIcon className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// === SPOTLIGHT CARD ===
function SpotlightCard({ announcement, isAdmin }: { announcement: Announcement; isAdmin: boolean }) {
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm shadow-warning-light/50 border border-warning group hover:shadow-card-hover hover:shadow-warning-light/50 transition-all duration-300">
      {isAdmin && (
        <Link
          href={`/admin/announcements/${announcement.id}`}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm hover:bg-warning-light rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10 border border-neutral-100"
          title="Edit spotlight"
        >
          <Cog6ToothIcon className="h-4 w-4 text-neutral-600" />
        </Link>
      )}

      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-warning via-accent-orange to-warning" />

      <div className="p-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-warning-light to-accent-orange-light rounded-full mb-4">
          <SparklesIcon className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-bold text-warning-dark uppercase tracking-wide">Story Spotlight</span>
        </div>

        <h4 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-warning transition-colors">
          {announcement.title}
        </h4>

        {announcement.imageUrl && (
          <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div
          className="prose prose-neutral prose-sm max-w-none text-neutral-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.content) }}
        />

        {announcement.linkUrl && (
          <div className="mt-5">
            <Link
              href={announcement.linkUrl}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-warning-light to-accent-orange text-white font-semibold text-sm rounded-xl hover:from-warning hover:to-accent-orange transition-all shadow-sm shadow-warning-light/50 group/link"
            >
              <span>{announcement.linkText || "Explore Story"}</span>
              <ArrowRightIcon className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// === REVIEW CARD ===
const reviewGradients = [
  { bg: 'from-primary-500 to-primary-600', light: 'from-primary-50 to-primary-50', border: 'border-primary-100', shadow: 'shadow-primary-100/50' },
  { bg: 'from-info to-accent-cyan', light: 'from-info-light to-accent-cyan-light', border: 'border-info', shadow: 'shadow-info-light/50' },
  { bg: 'from-success-light to-success', light: 'from-success-light to-success-light', border: 'border-success', shadow: 'shadow-success-light/50' },
  { bg: 'from-error to-accent-pink', light: 'from-error-light to-accent-pink-light', border: 'border-error', shadow: 'shadow-error-light/50' },
  { bg: 'from-warning-light to-accent-orange', light: 'from-warning-light to-accent-orange-light', border: 'border-warning', shadow: 'shadow-warning-light/50' },
];

function ReviewCard({ announcement, isAdmin, colorIndex }: { announcement: Announcement; isAdmin: boolean; colorIndex: number }) {
  const colors = reviewGradients[colorIndex % reviewGradients.length];

  return (
    <div className={`relative bg-gradient-to-br ${colors.light} rounded-2xl p-6 border ${colors.border} shadow-sm ${colors.shadow} group hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
      {/* Large decorative quote */}
      <div className="absolute -top-4 -left-2 text-[100px] font-serif text-neutral-900/5 leading-none select-none pointer-events-none">
        &ldquo;
      </div>

      {isAdmin && (
        <Link
          href={`/admin/announcements/${announcement.id}`}
          className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
          title="Edit review"
        >
          <Cog6ToothIcon className="h-3.5 w-3.5 text-neutral-500" />
        </Link>
      )}

      <div className="relative">
        {/* Stars */}
        <div className="flex items-center gap-0.5 mb-4">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className="h-4 w-4 fill-amber-400 text-warning drop-shadow-sm" />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-neutral-700 font-medium leading-relaxed mb-5 line-clamp-4">
          &ldquo;{announcement.content}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-200/50">
          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-sm`}>
            <span className="text-white text-sm font-bold">
              {announcement.title.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-bold text-neutral-900 text-sm">{announcement.title}</p>
            <p className="text-xs text-neutral-500">5-Star Review</p>
          </div>
        </div>
      </div>
    </div>
  );
}
