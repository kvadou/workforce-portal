import type { CMSBlock } from "@/providers/CMSProvider";

interface AnnouncementForCMS {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkText: string | null;
}

interface BuildHomeCMSBlocksParams {
  importantDates: AnnouncementForCMS[];
  regularAnnouncements: AnnouncementForCMS[];
  storySpotlights: AnnouncementForCMS[];
  tutorReviews: AnnouncementForCMS[];
  currentMonth: string;
  generateId: () => string;
}

export function buildInitialHomeCMSBlocks({
  importantDates,
  regularAnnouncements,
  storySpotlights,
  tutorReviews,
  currentMonth,
  generateId,
}: BuildHomeCMSBlocksParams): CMSBlock[] {
  const newBlocks: CMSBlock[] = [];

  // 1. Hero Banner
  newBlocks.push({
    id: generateId(),
    type: "heroBanner",
    content: {
      title: "Welcome to Acme Workforce!",
      subtitle: "",
      backgroundImage: "/images/hero-banner.jpg",
      overlayOpacity: 10,
      textColor: "text-primary-700",
      height: "260px",
    },
    order: newBlocks.length,
  });

  // 2. Spacer
  newBlocks.push({
    id: generateId(),
    type: "spacer",
    content: { height: 32 },
    order: newBlocks.length,
  });

  // 3. Month Header
  newBlocks.push({
    id: generateId(),
    type: "heading",
    content: { text: currentMonth, level: 2, alignment: "center" },
    order: newBlocks.length,
  });

  // 4. Pre-generate section header IDs for navigation buttons
  const importantDatesHeaderId = generateId();
  const announcementsHeaderId = generateId();
  const spotlightsHeaderId = generateId();
  const reviewsHeaderId = generateId();

  // 5. Navigation Buttons (between month and content)
  const navButtons = [];
  if (importantDates.length > 0) {
    navButtons.push({
      id: "btn-1",
      label: "Important Dates",
      targetId: importantDatesHeaderId,
      color: "primary",
    });
  }
  if (regularAnnouncements.length > 0) {
    navButtons.push({
      id: "btn-2",
      label: "Announcements",
      targetId: announcementsHeaderId,
      color: "green",
    });
  }
  if (storySpotlights.length > 0) {
    navButtons.push({
      id: "btn-3",
      label: "Story Spotlights",
      targetId: spotlightsHeaderId,
      color: "orange",
    });
  }
  if (tutorReviews.length > 0) {
    navButtons.push({
      id: "btn-4",
      label: "Tutor Reviews",
      targetId: reviewsHeaderId,
      color: "cyan",
    });
  }

  if (navButtons.length > 0) {
    newBlocks.push({
      id: generateId(),
      type: "navigationButtons",
      content: {
        buttons: navButtons,
        alignment: "center",
        spacing: "normal",
      },
      order: newBlocks.length,
    });
  }

  // 6. Important Dates Section
  if (importantDates.length > 0) {
    newBlocks.push({
      id: importantDatesHeaderId,
      type: "sectionHeader",
      content: {
        title: "Important Dates!",
        icon: "calendar",
        color: "primary",
        showDivider: false,
      },
      order: newBlocks.length,
    });

    importantDates.forEach((date) => {
      newBlocks.push({
        id: generateId(),
        type: "importantDate",
        content: {
          title: date.title,
          description: date.content || "",
          date: "",
        },
        order: newBlocks.length,
      });
    });
  }

  // 7. Announcements Section
  if (regularAnnouncements.length > 0) {
    newBlocks.push({
      id: announcementsHeaderId,
      type: "sectionHeader",
      content: {
        title: "What's Happening in Chesslandia??",
        icon: "megaphone",
        color: "green",
        showDivider: true,
      },
      order: newBlocks.length,
    });

    regularAnnouncements.forEach((ann) => {
      newBlocks.push({
        id: generateId(),
        type: "announcement",
        content: {
          title: ann.title,
          body: ann.content || "",
          imageUrl: ann.imageUrl || "",
          linkUrl: ann.linkUrl || "",
          linkText: ann.linkText || "",
        },
        order: newBlocks.length,
      });
    });
  }

  // 8. Story Spotlights Section
  if (storySpotlights.length > 0) {
    newBlocks.push({
      id: spotlightsHeaderId,
      type: "sectionHeader",
      content: {
        title: "Story Spotlights",
        icon: "book",
        color: "orange",
        showDivider: true,
      },
      order: newBlocks.length,
    });

    storySpotlights.forEach((spot) => {
      newBlocks.push({
        id: generateId(),
        type: "spotlight",
        content: {
          title: spot.title,
          body: spot.content || "",
          imageUrl: spot.imageUrl || "",
          linkUrl: spot.linkUrl || "",
          linkText: spot.linkText || "",
        },
        order: newBlocks.length,
      });
    });
  }

  // 9. Tutor Reviews Section
  if (tutorReviews.length > 0) {
    newBlocks.push({
      id: reviewsHeaderId,
      type: "sectionHeader",
      content: {
        title: "Tutor Reviews!",
        subtitle:
          "Time to celebrate the amazing impact you're having on our families!",
        icon: "star",
        color: "cyan",
        showDivider: true,
      },
      order: newBlocks.length,
    });

    tutorReviews.forEach((review) => {
      newBlocks.push({
        id: generateId(),
        type: "review",
        content: {
          quote: review.content || "",
          author: review.title,
          rating: 5,
        },
        order: newBlocks.length,
      });
    });
  }

  return newBlocks;
}
