"use client";

import { useEffect, useState } from "react";
import { MainNav } from "./MainNav";

interface Course {
  id: string;
  title: string;
}

type UserRole = "SUPER_ADMIN" | "ADMIN" | "FRANCHISEE_OWNER" | "LEAD_TUTOR" | "TUTOR" | "ONBOARDING_TUTOR";

interface ClientHeaderProps {
  userName?: string;
  userRole?: UserRole;
}

/**
 * Client-side header component that fetches courses via API.
 * Use this in client components. For server components, use SiteHeader instead.
 */
export function ClientHeader({ userName = "Demo Tutor", userRole }: ClientHeaderProps) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch("/api/courses?status=PUBLISHED");
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    }
    fetchCourses();
  }, []);

  return <MainNav courses={courses} userName={userName} userRole={userRole} />;
}
