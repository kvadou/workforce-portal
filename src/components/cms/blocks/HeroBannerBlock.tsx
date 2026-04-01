"use client";

import { useState, useCallback, useEffect } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  ArrowUpTrayIcon,
  PhotoIcon as ImageIcon,
  ArrowPathIcon,
  FolderOpenIcon,
  TrophyIcon,
  SparklesIcon,
  StarIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { MediaLibrary } from "../MediaLibrary";
import { toast } from "sonner";

interface HeroBannerBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function HeroBannerBlock({ block, isEditing }: HeroBannerBlockProps) {
  const { updateBlock, blocks } = useCMS();
  const content = block.content as {
    greeting?: string;
    title: string;
    subtitle?: string;
    badgeText?: string;
    backgroundImage?: string;
    imageScale?: number; // Legacy - kept for backwards compatibility
    imageScaleMobile?: number; // Mobile-specific zoom (50-200)
    imageScaleDesktop?: number; // Desktop-specific zoom (50-200)
    imagePositionY?: number; // 0-100, percentage from top
    imagePositionYMobile?: number; // Mobile-specific position
    imagePositionYDesktop?: number; // Desktop-specific position
    gradientOpacity?: number; // 0-100, how strong the gradient overlay is
    overlayOpacity?: number;
    textColor?: string;
    height?: string;
    useGradient?: boolean;
  };

  const [isUploading, setIsUploading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showImageControls, setShowImageControls] = useState(false);
  const [editingViewport, setEditingViewport] = useState<'mobile' | 'desktop'>('desktop');
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect current viewport size
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileView(window.innerWidth < 640); // sm breakpoint
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Image position and gradient defaults - separate for mobile and desktop
  const imageScaleMobile = content.imageScaleMobile ?? content.imageScale ?? 120;
  const imageScaleDesktop = content.imageScaleDesktop ?? content.imageScale ?? 100;
  const imagePositionYMobile = content.imagePositionYMobile ?? content.imagePositionY ?? 50;
  const imagePositionYDesktop = content.imagePositionYDesktop ?? content.imagePositionY ?? 50;
  const gradientOpacity = content.gradientOpacity ?? 60;

  // Default greeting
  const greeting = content.greeting || "Welcome to";

  // Count blocks by type and get section header titles for labels
  const importantDatesCount = blocks.filter(b => b.type === "importantDate").length;
  const announcementsCount = blocks.filter(b => b.type === "announcement").length;
  const spotlightsCount = blocks.filter(b => b.type === "spotlight").length;
  const reviewsCount = blocks.filter(b => b.type === "review").length;

  // Find section headers to get their titles for stats labels
  const sectionHeaders = blocks.filter(b => b.type === "sectionHeader");
  const findSectionLabel = (defaultLabel: string, icon: string) => {
    // Try to find a section header with matching icon
    const iconMap: Record<string, string> = {
      'calendar': 'Important Dates',
      'megaphone': 'Announcements',
      'book': 'Spotlights',
      'star': 'Reviews',
    };
    const header = sectionHeaders.find(h => {
      const c = h.content as { icon?: string };
      return c.icon === icon;
    });
    if (header) {
      const c = header.content as { title?: string };
      return c.title || defaultLabel;
    }
    return defaultLabel;
  };

  const stats = [
    { id: 'dates', label: findSectionLabel('Important Dates', 'calendar'), icon: CalendarDaysIcon, gradient: 'from-error to-accent-pink', count: importantDatesCount, show: importantDatesCount > 0 },
    { id: 'announcements', label: findSectionLabel('Announcements', 'megaphone'), icon: MegaphoneIcon, gradient: 'from-success-light to-success', count: announcementsCount, show: announcementsCount > 0 },
    { id: 'spotlights', label: findSectionLabel('Spotlights', 'book'), icon: BookOpenIcon, gradient: 'from-warning-light to-accent-orange', count: spotlightsCount, show: spotlightsCount > 0 },
    { id: 'reviews', label: findSectionLabel('Reviews', 'star'), icon: StarIcon, gradient: 'from-primary-500 to-primary-600', count: reviewsCount, show: reviewsCount > 0 },
  ].filter(s => s.show);

  const handleImageUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const urlResponse = await fetch(
          `/api/media/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        );
        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, fileUrl, filename } = await urlResponse.json();

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Save to database
        await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: filename || file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url: fileUrl,
            thumbnailUrl: fileUrl,
          }),
        });

        updateBlock(block.id, { backgroundImage: fileUrl, useGradient: false });
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [block.id, updateBlock]
  );

  const handleMediaSelect = (url: string) => {
    // Keep gradient mode, just add the background image
    updateBlock(block.id, { backgroundImage: url });
    setShowMediaLibrary(false);
  };

  const handleRemoveImage = () => {
    updateBlock(block.id, { backgroundImage: "" });
  };

  if (isEditing) {
    return (
      <>
        <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-primary-300">
          {/* Full preview of gradient hero matching view mode */}
          <div className="relative overflow-hidden">
            {/* Gradient background preview */}
            <div className="relative">
                {/* Background image layer - shows selected viewport's settings */}
                {content.backgroundImage && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url('${content.backgroundImage}')`,
                      backgroundSize: `${editingViewport === 'mobile' ? imageScaleMobile : imageScaleDesktop}%`,
                      backgroundPosition: `center ${editingViewport === 'mobile' ? imagePositionYMobile : imagePositionYDesktop}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}

                {/* Gradient overlay */}
                <div
                  className={`${content.backgroundImage ? 'absolute inset-0' : ''} bg-gradient-to-br from-accent-navy via-primary-600 to-accent-pink`}
                  style={content.backgroundImage ? { opacity: gradientOpacity / 100 } : undefined}
                >
                  {/* Animated orbs */}
                  <div className="absolute top-0 left-1/4 h-48 w-48 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-1/4 h-40 w-40 bg-accent-pink/20 rounded-full blur-3xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-navy/10 rounded-full blur-3xl" />
                </div>

                {/* Decorative icons */}
                <div className="absolute left-4 bottom-16 opacity-20">
                  <TrophyIcon className="h-16 w-16 text-white" />
                </div>
                <div className="absolute right-4 bottom-16 opacity-20">
                  <StarIcon className="h-16 w-16 text-white" />
                </div>

                {/* Hero content */}
                <div className="relative z-10 px-4 py-10 md:py-16">
                  <div className="max-w-3xl mx-auto text-center">
                    {/* Badge - editable */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full border border-white/20 mb-4">
                      <TrophyIcon className="h-4 w-4 text-warning" />
                      <input
                        type="text"
                        value={content.badgeText || "Your Tutor Command Center"}
                        onChange={(e) => updateBlock(block.id, { badgeText: e.target.value })}
                        placeholder="Your Tutor Command Center"
                        className="text-sm font-semibold text-white/90 bg-transparent border-b border-dashed border-white/30 focus:border-white/60 focus:outline-none text-center caret-white placeholder:text-white/50 min-w-[180px]"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <SparklesIcon className="h-4 w-4 text-warning" />
                    </div>

                    {/* Main heading with editable greeting and title */}
                    <div className="mb-3">
                      <input
                        type="text"
                        value={content.greeting || "Welcome to"}
                        onChange={(e) => updateBlock(block.id, { greeting: e.target.value })}
                        placeholder="Welcome to"
                        className="w-full text-center text-2xl md:text-4xl font-black bg-transparent border-b-2 border-dashed border-white/30 focus:border-white/60 focus:outline-none text-white caret-white placeholder:text-white/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="text"
                        value={content.title || "Acme Workforce!"}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        placeholder="Acme Workforce!"
                        className="w-full text-center text-2xl md:text-4xl font-black bg-transparent border-b-2 border-dashed border-warning/50 focus:border-warning focus:outline-none text-warning caret-white placeholder:text-warning/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Subtitle input */}
                    <input
                      type="text"
                      value={content.subtitle || ""}
                      onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                      placeholder="Everything you need to deliver magical chess lessons"
                      className="w-full text-center text-base bg-transparent border-b border-dashed border-white/20 focus:border-white/40 focus:outline-none text-white/80 caret-white placeholder:text-white/40 mb-6"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Stats preview - showing live counts, pb-6 adds space above wave */}
                    {stats.length > 0 && (
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 pb-6 px-2 sm:px-0">
                        {stats.map((stat) => {
                          const Icon = stat.icon;
                          return (
                            <div
                              key={stat.id}
                              className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10"
                            >
                              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="text-left min-w-0">
                                <div className="text-lg font-bold text-white">{stat.count}</div>
                                <div className="text-[10px] text-white/60 font-medium truncate">{stat.label}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Wave divider preview */}
                <div className="absolute bottom-0 left-0 right-0">
                  <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                    <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#E3F8FF"/>
                  </svg>
                </div>
              </div>
          </div>

          {/* Controls - z-30 ensures they're above hero content (z-10) */}
          <div className="absolute top-4 right-4 z-30 flex gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Image controls */}
            {isUploading ? (
              <div className="bg-white rounded-lg px-3 py-2 shadow-sm flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-primary-500" />
                <span className="text-sm">Uploading...</span>
              </div>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMediaLibrary(true);
                  }}
                  className="bg-white rounded-lg px-3 py-2 shadow-sm hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  <FolderOpenIcon className="h-4 w-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">{content.backgroundImage ? "Change" : "Add"} Image</span>
                </button>

                <label
                  className="cursor-pointer bg-white rounded-lg px-3 py-2 shadow-sm hover:bg-neutral-50 transition-colors flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      e.stopPropagation();
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  <ArrowUpTrayIcon className="h-4 w-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">Upload</span>
                </label>
              </>
            )}
          </div>

          {/* Image controls panel - z-30 ensures they're above hero content (z-10) */}
          {content.backgroundImage && (
            <div className="absolute top-4 left-4 z-30 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Image indicator with Remove */}
              <div className="bg-white/95 rounded-lg px-3 py-2 shadow-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-neutral-700">Background</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImageControls(!showImageControls);
                  }}
                  className="text-accent-navy hover:text-accent-navy text-xs font-medium ml-1"
                >
                  {showImageControls ? "Hide" : "Adjust"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="text-error hover:text-error text-xs font-medium ml-1"
                >
                  Remove
                </button>
              </div>

              {/* Image position controls */}
              {showImageControls && (
                <div className="bg-white/95 rounded-lg px-4 py-3 shadow-sm space-y-3 min-w-[220px]">
                  {/* Mobile/Desktop Toggle */}
                  <div className="flex items-center justify-center gap-1 p-1 bg-neutral-100 rounded-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingViewport('mobile');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        editingViewport === 'mobile'
                          ? 'bg-white text-accent-navy shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      <ComputerDesktopIcon className="h-3.5 w-3.5" />
                      Mobile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingViewport('desktop');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        editingViewport === 'desktop'
                          ? 'bg-white text-accent-navy shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      <ComputerDesktopIcon className="h-3.5 w-3.5" />
                      Desktop
                    </button>
                  </div>

                  {/* Zoom/Scale control - separate for mobile/desktop */}
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 flex justify-between">
                      <span>Zoom ({editingViewport})</span>
                      <span className="text-neutral-400">
                        {editingViewport === 'mobile' ? imageScaleMobile : imageScaleDesktop}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={editingViewport === 'mobile' ? imageScaleMobile : imageScaleDesktop}
                      onChange={(e) => {
                        e.stopPropagation();
                        const key = editingViewport === 'mobile' ? 'imageScaleMobile' : 'imageScaleDesktop';
                        updateBlock(block.id, { [key]: parseInt(e.target.value) });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                      <span>Zoom Out</span>
                      <span>100%</span>
                      <span>Zoom In</span>
                    </div>
                  </div>

                  {/* Vertical position control - separate for mobile/desktop */}
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 flex justify-between">
                      <span>Position ({editingViewport})</span>
                      <span className="text-neutral-400">
                        {editingViewport === 'mobile' ? imagePositionYMobile : imagePositionYDesktop}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={editingViewport === 'mobile' ? imagePositionYMobile : imagePositionYDesktop}
                      onChange={(e) => {
                        e.stopPropagation();
                        const key = editingViewport === 'mobile' ? 'imagePositionYMobile' : 'imagePositionYDesktop';
                        updateBlock(block.id, { [key]: parseInt(e.target.value) });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                      <span>Top</span>
                      <span>Center</span>
                      <span>Bottom</span>
                    </div>
                  </div>

                  {/* Gradient opacity control - shared between viewports */}
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 flex justify-between">
                      <span>Gradient Overlay</span>
                      <span className="text-neutral-400">{gradientOpacity}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={gradientOpacity}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateBlock(block.id, { gradientOpacity: parseInt(e.target.value) });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                      <span>Clear</span>
                      <span>Medium</span>
                      <span>Full</span>
                    </div>
                  </div>

                  {/* Reset button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateBlock(block.id, {
                        imageScaleMobile: 120,
                        imageScaleDesktop: 100,
                        imagePositionYMobile: 50,
                        imagePositionYDesktop: 50,
                        gradientOpacity: 60
                      });
                    }}
                    className="w-full text-xs text-neutral-500 hover:text-neutral-700 py-1"
                  >
                    Reset to Default
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleMediaSelect}
          allowedTypes={["image"]}
        />
      </>
    );
  }

  // View mode - New vibrant gradient design
  return (
    <div
      className="relative overflow-hidden"
      style={{
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        width: "100vw",
      }}
    >
      {/* Background image layer - separate for mobile and desktop */}
          {content.backgroundImage && (
            <>
              {/* Mobile background */}
              <div
                className="absolute inset-0 sm:hidden"
                style={{
                  backgroundImage: `url('${content.backgroundImage}')`,
                  backgroundSize: `${imageScaleMobile}%`,
                  backgroundPosition: `center ${imagePositionYMobile}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
              {/* Desktop background */}
              <div
                className="absolute inset-0 hidden sm:block"
                style={{
                  backgroundImage: `url('${content.backgroundImage}')`,
                  backgroundSize: `${imageScaleDesktop}%`,
                  backgroundPosition: `center ${imagePositionYDesktop}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </>
          )}

          {/* Gradient overlay - semi-transparent when image is present */}
          <div
            className={`absolute inset-0 bg-gradient-to-br from-accent-navy via-primary-600 to-accent-pink`}
            style={content.backgroundImage ? { opacity: gradientOpacity / 100 } : undefined}
          >
            {/* Animated orbs */}
            <div className="absolute top-0 left-1/4 h-96 w-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-80 w-80 bg-accent-pink/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-navy/10 rounded-full blur-3xl" />
          </div>

          {/* Decorative icons */}
          <div className="absolute left-4 bottom-20 opacity-20">
            <TrophyIcon className="h-20 w-20 md:w-28 md:h-28 text-white" />
          </div>
          <div className="absolute right-4 bottom-20 opacity-20">
            <StarIcon className="h-20 w-20 md:w-28 md:h-28 text-white" />
          </div>

          {/* Hero content - tighter padding on mobile to fit within background image */}
          <div className="relative z-10 px-4 pt-2 pb-4 sm:py-12 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/15 backdrop-blur-md rounded-full border border-white/20 mb-3 sm:mb-6">
                <TrophyIcon className="h-3.5 w-3.5 sm:w-4 sm:h-4 text-warning" />
                <span className="text-xs sm:text-sm font-semibold text-white/90">{content.badgeText || "Your Tutor Command Center"}</span>
                <SparklesIcon className="h-3.5 w-3.5 sm:w-4 sm:h-4 text-warning" />
              </div>

              {/* Main heading */}
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2 sm:mb-3 tracking-tight">
                <span className="block">{greeting}</span>
                <span className="block bg-gradient-to-r from-warning-light via-warning to-warning-light bg-clip-text text-transparent">
                  {content.title || "Acme Workforce!"}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-4 sm:mb-8">
                {content.subtitle || "Everything you need to deliver magical chess lessons. Resources, announcements, and community - all in one place."}
              </p>

              {/* Quick stats */}
              {stats.length > 0 && (
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-4 pb-2 sm:pb-8 px-2 sm:px-0">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <button
                        key={stat.id}
                        onClick={() => {
                          // Scroll to the specific section with header offset
                          const element = document.getElementById(stat.id);
                          if (element) {
                            const headerOffset = 130; // Account for fixed header + breathing room
                            const elementPosition = element.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.scrollY - headerOffset;
                            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                          }
                        }}
                        className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
                      >
                        <div className={`h-8 w-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                          <Icon className="h-4 w-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-lg sm:text-2xl font-bold text-white">{stat.count}</div>
                          <div className="text-[10px] sm:text-xs text-white/60 font-medium truncate">{stat.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#E3F8FF"/>
            </svg>
          </div>
    </div>
  );
}
