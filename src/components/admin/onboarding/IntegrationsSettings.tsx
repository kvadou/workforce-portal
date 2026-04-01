"use client";

import { useState } from "react";
import {
  CheckIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  XCircleIcon,
  PlayCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useCanvaConnection } from "@/hooks/useCanva";
import { CanvaDesignPicker } from "@/components/admin/CanvaDesignPicker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export function IntegrationsSettings() {
  const { status: canvaStatus, isLoading: canvaLoading, disconnect: disconnectCanva } = useCanvaConnection();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showCanvaPicker, setShowCanvaPicker] = useState(false);

  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  const handleDisconnectCanva = async () => {
    setIsDisconnecting(true);
    await disconnectCanva();
    setIsDisconnecting(false);
  };

  // Check for Vimeo configuration (it uses env vars, not OAuth)
  const vimeoConfigured = true; // Vimeo uses static token, always "configured" if env var is set

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          External Integrations
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Connect external services to enhance your onboarding content
        </p>
      </div>

      {/* Vimeo Integration */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <PlayCircleIcon className="h-5 w-5 text-info" />
            <h3 className="font-medium text-neutral-900">Vimeo</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-success-light rounded-lg flex items-center justify-center">
                <CheckIcon className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-success-dark">Vimeo Connected</p>
                <p className="text-sm text-success-dark">
                  Video hosting for training content
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-success-light text-success-dark text-sm rounded-lg">
              API Token
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-4">
            Vimeo is configured via environment variables. Use the Training Videos tab to browse and add videos.
          </p>
        </div>
      </div>

      {/* Canva Integration */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-primary-600" />
            <h3 className="font-medium text-neutral-900">Canva</h3>
          </div>
        </div>
        <div className="p-4">
          {canvaLoading ? (
            <div className="flex items-center gap-2 text-neutral-500">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking connection...</span>
            </div>
          ) : canvaStatus?.connected ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-success-light rounded-lg flex items-center justify-center">
                    <CheckIcon className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-success-dark">Canva Connected</p>
                    <p className="text-sm text-success-dark">
                      {canvaStatus.displayName ? `Connected as ${canvaStatus.displayName}` : "Design embeds enabled"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDisconnectConfirmOpen(true)}
                  disabled={isDisconnecting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-error hover:text-error-dark hover:bg-error-light rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircleIcon className="h-4 w-4" />
                  )}
                  Disconnect
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <button
                  onClick={() => setShowCanvaPicker(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <PhotoIcon className="h-4 w-4" />
                  Browse Canva Designs
                </button>
                <p className="text-sm text-neutral-500 mt-2">
                  Test the integration by browsing your Canva designs
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <XMarkIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">Canva Not Connected</p>
                    <p className="text-sm text-neutral-500">
                      Connect to browse and embed Canva designs
                    </p>
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- OAuth requires full page navigation */}
                <a
                  href="/api/auth/canva"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Connect Canva
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>
              <p className="text-sm text-neutral-500 mt-4">
                Connect your Canva account to embed presentations, infographics, and other designs in your training materials.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Future integrations placeholder */}
      <div className="border border-dashed border-neutral-300 rounded-lg p-6 text-center">
        <p className="text-sm text-neutral-500">
          More integrations coming soon (Google Drive, Loom, etc.)
        </p>
      </div>

      {/* Canva Design Picker Modal */}
      <CanvaDesignPicker
        isOpen={showCanvaPicker}
        onClose={() => setShowCanvaPicker(false)}
        onSelect={(design) => {
          console.log("Selected design:", design);
          toast.success(`Selected: ${design.title}`);
          setShowCanvaPicker(false);
        }}
      />

      <ConfirmDialog
        isOpen={disconnectConfirmOpen}
        onClose={() => setDisconnectConfirmOpen(false)}
        onConfirm={handleDisconnectCanva}
        title="Disconnect Canva"
        message="Are you sure you want to disconnect Canva?"
        variant="danger"
        confirmLabel="Disconnect"
      />
    </div>
  );
}
