"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ShareIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CertificatePreview } from "@/components/certificates/CertificatePreview";

interface Certificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  pdfUrl: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    category: string;
  };
}

async function fetchCertificates(): Promise<Certificate[]> {
  const response = await fetch("/api/certificates");
  if (!response.ok) throw new Error("Failed to fetch certificates");
  return response.json();
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    ONBOARDING: "bg-info-light text-info-dark",
    TEACHING_SKILLS: "bg-success-light text-success-dark",
    CHESS_SKILLS: "bg-warning-light text-warning-dark",
    BUSINESS: "bg-primary-100 text-primary-700",
    LEADERSHIP: "bg-accent-navy-light text-accent-navy",
    CERTIFICATION: "bg-error-light text-error-dark",
  };
  return colors[category] || "bg-neutral-100 text-neutral-700";
}

function formatCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CertificatesClient() {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: certificates, isLoading, error } = useQuery({
    queryKey: ["certificates"],
    queryFn: fetchCertificates,
  });

  const handleShare = async (certificate: Certificate) => {
    const verifyUrl = `${window.location.origin}/certificates/verify?number=${certificate.certificateNumber}`;

    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopiedId(certificate.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = verifyUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(certificate.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-warning flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                My Certificates
              </h1>
              <p className="text-neutral-600">
                View and share your earned achievements
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-error">Failed to load certificates</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && certificates?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <TrophyIcon className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No certificates yet
            </h3>
            <p className="text-neutral-500 mb-4">
              Complete training courses to earn certificates
            </p>
            <Link href="/training">
              <Button>
                <BookOpenIcon className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </Link>
          </div>
        )}

        {/* Certificates Grid */}
        {!isLoading && !error && certificates && certificates.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-sm transition-shadow"
              >
                {/* Certificate Preview */}
                <div
                  className="relative h-40 bg-gradient-to-br from-warning-light to-white p-4 cursor-pointer"
                  onClick={() => setSelectedCertificate(certificate)}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <TrophyIcon className="w-32 h-32 text-warning" />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="text-xs font-medium text-warning">
                      CERTIFICATE OF COMPLETION
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 line-clamp-2">
                        {certificate.course.title}
                      </h3>
                      <span
                        className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                          certificate.course.category
                        )}`}
                      >
                        {formatCategory(certificate.course.category)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-neutral-500">
                      <CalendarDaysIcon className="w-4 h-4" />
                      {format(new Date(certificate.issuedAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-neutral-400 font-mono">
                      {certificate.certificateNumber}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedCertificate(certificate)}
                    >
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(certificate)}
                    >
                      {copiedId === certificate.id ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <ShareIcon className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certificate Preview Modal */}
        {selectedCertificate && (
          <CertificatePreview
            recipientName="Your Name"
            courseName={selectedCertificate.course.title}
            completionDate={new Date(selectedCertificate.issuedAt)}
            certificateNumber={selectedCertificate.certificateNumber}
            onClose={() => setSelectedCertificate(null)}
          />
        )}
      </div>
    </div>
  );
}
