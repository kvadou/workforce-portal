"use client";

import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  TrophyIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";

interface CertificatePreviewProps {
  recipientName: string;
  courseName: string;
  completionDate: Date;
  certificateNumber: string;
  onClose: () => void;
}

export function CertificatePreview({
  recipientName,
  courseName,
  completionDate,
  certificateNumber,
  onClose,
}: CertificatePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const verifyUrl = `${window.location.origin}/certificates/verify?number=${certificateNumber}`;

    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = verifyUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Certificate Preview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Certificate */}
        <div className="p-6">
          <div
            id="certificate"
            className="bg-gradient-to-br from-warning-light via-white to-warning-light border-4 border-warning rounded-xl p-8 sm:p-12 text-center relative overflow-hidden print:m-0 print:rounded-none print:border-8"
          >
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 h-8 w-8 border-t-4 border-l-4 border-warning rounded-tl-lg" />
            <div className="absolute top-4 right-4 h-8 w-8 border-t-4 border-r-4 border-warning rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 h-8 w-8 border-b-4 border-l-4 border-warning rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b-4 border-r-4 border-warning rounded-br-lg" />

            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-warning to-warning flex items-center justify-center shadow-sm">
                <TrophyIcon className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-warning-dark mb-2">
              Certificate of Completion
            </h1>
            <p className="text-neutral-500 mb-8">Acme Workforce Training Program</p>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warning to-transparent" />
              <div className="h-2 w-2 rounded-full bg-warning" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warning to-transparent" />
            </div>

            {/* Recipient */}
            <p className="text-neutral-600 mb-2">This certifies that</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
              {recipientName}
            </h2>

            {/* Course */}
            <p className="text-neutral-600 mb-2">has successfully completed</p>
            <h3 className="text-xl sm:text-2xl font-semibold text-primary-700 mb-8">
              {courseName}
            </h3>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warning to-transparent" />
              <div className="h-2 w-2 rounded-full bg-warning" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warning to-transparent" />
            </div>

            {/* Date & Number */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-500">
              <div>
                <p className="font-medium text-neutral-700">Date Issued</p>
                <p>{format(completionDate, "MMMM d, yyyy")}</p>
              </div>
              <div className="hidden sm:block w-px h-8 bg-neutral-200" />
              <div>
                <p className="font-medium text-neutral-700">Certificate Number</p>
                <p className="font-mono">{certificateNumber}</p>
              </div>
            </div>

            {/* Verification note */}
            <p className="mt-8 text-xs text-neutral-400">
              Verify this certificate at workforceportal.com/certificates/verify
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3 print:hidden">
          <Button variant="outline" onClick={handleShare}>
            {copied ? (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2 text-success" />
                Link Copied!
              </>
            ) : (
              <>
                <ShareIcon className="h-4 w-4 mr-2" />
                Share Link
              </>
            )}
          </Button>
          <Button onClick={handlePrint}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Print / Download
          </Button>
        </div>
      </div>
    </div>
  );
}
