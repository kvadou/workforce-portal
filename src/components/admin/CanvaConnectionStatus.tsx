"use client";

import { useState } from "react";
import {
  CheckIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useCanvaConnection } from "@/hooks/useCanva";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CanvaConnectionStatusProps {
  showDisconnect?: boolean;
}

/**
 * Component to display Canva connection status with connect/disconnect actions
 */
export function CanvaConnectionStatus({
  showDisconnect = true,
}: CanvaConnectionStatusProps) {
  const { status, isLoading, refresh, disconnect } = useCanvaConnection();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    await disconnect();
    setIsDisconnecting(false);
    setDisconnectConfirmOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-500">
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking Canva connection...</span>
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="flex items-center justify-between p-4 bg-success-light border border-success rounded-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-success-light rounded-lg flex items-center justify-center">
            <CheckIcon className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="font-medium text-success-dark">Canva Connected</p>
            {status.displayName && (
              <p className="text-sm text-success-dark">
                Connected as {status.displayName}
              </p>
            )}
          </div>
        </div>
        {showDisconnect && (
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
        )}
        <ConfirmDialog
          isOpen={disconnectConfirmOpen}
          onClose={() => setDisconnectConfirmOpen(false)}
          onConfirm={handleDisconnect}
          title="Disconnect Canva"
          message="Are you sure you want to disconnect Canva?"
          variant="danger"
          confirmLabel="Disconnect"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
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
  );
}
