import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET public onboarding config
// This endpoint returns all necessary configuration for onboarding pages
// Requires authentication but any logged-in user can access
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const include = searchParams.get("include")?.split(",") || ["all"];
    const includeAll = include.includes("all");

    const data: Record<string, unknown> = {};

    // Fetch config settings (key-value pairs)
    if (includeAll || include.includes("config")) {
      const configs = await prisma.onboardingConfig.findMany({
        where: { isActive: true },
      });
      // Convert to key-value object for easier consumption
      data.config = configs.reduce((acc, config) => {
        let value: string | number | boolean | object = config.value;
        // Parse value based on type
        if (config.valueType === "NUMBER") {
          value = parseFloat(config.value);
        } else if (config.valueType === "BOOLEAN") {
          value = config.value === "true";
        } else if (config.valueType === "JSON") {
          try {
            value = JSON.parse(config.value);
          } catch {
            // Keep as string if JSON parsing fails
          }
        }
        acc[config.key] = value;
        return acc;
      }, {} as Record<string, string | number | boolean | object>);
    }

    // Fetch journey steps
    if (includeAll || include.includes("journeySteps")) {
      data.journeySteps = await prisma.onboardingJourneyStep.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
    }

    // Fetch badges
    if (includeAll || include.includes("badges")) {
      const badges = await prisma.onboardingBadge.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
      // Parse colorScheme JSON
      data.badges = badges.map((badge) => ({
        ...badge,
        colorScheme: JSON.parse(badge.colorScheme),
      }));
    }

    // Fetch dropdown options
    if (includeAll || include.includes("dropdownOptions")) {
      const options = await prisma.onboardingDropdownOption.findMany({
        where: { isActive: true },
        orderBy: [{ fieldKey: "asc" }, { order: "asc" }],
      });
      // Group by fieldKey
      data.dropdownOptions = options.reduce((acc, option) => {
        if (!acc[option.fieldKey]) {
          acc[option.fieldKey] = [];
        }
        acc[option.fieldKey].push({
          value: option.value,
          label: option.label,
        });
        return acc;
      }, {} as Record<string, { value: string; label: string }[]>);
    }

    // Fetch orientation agenda
    if (includeAll || include.includes("orientationAgenda")) {
      data.orientationAgenda = await prisma.onboardingOrientationAgenda.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Error fetching onboarding config:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding config" },
      { status: 500 }
    );
  }
}
