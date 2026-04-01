"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  PhotoIcon as ImageIcon,
  LinkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { ResourceType } from "@prisma/client";
import { AdminEditLink } from "@/components/admin/AdminEditButton";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  url: string | null;
  fileUrl: string | null;
  type: ResourceType;
  order: number;
}

interface ResourceCardProps {
  resource: Resource;
  variant?: "default" | "compact";
}

const TYPE_CONFIG: Record<ResourceType, {
  icon: typeof PlayIcon;
  label: string;
  action: string;
  gradient: string;
  bgGradient: string;
}> = {
  VIDEO: {
    icon: PlayIcon,
    label: "Video",
    action: "Watch Video",
    gradient: "from-primary-500 to-primary-700",
    bgGradient: "from-primary-50 to-primary-100"
  },
  PDF: {
    icon: ArrowDownTrayIcon,
    label: "PDF",
    action: "Download PDF",
    gradient: "from-error to-error",
    bgGradient: "from-error-light to-error-light"
  },
  IMAGE: {
    icon: ImageIcon,
    label: "Image",
    action: "View Image",
    gradient: "from-success-light to-success",
    bgGradient: "from-success-light to-success-light"
  },
  LINK: {
    icon: LinkIcon,
    label: "Link",
    action: "Open Link",
    gradient: "from-info to-accent-cyan",
    bgGradient: "from-info-light to-accent-cyan-light"
  },
  RICH_TEXT: {
    icon: DocumentTextIcon,
    label: "Article",
    action: "Read More",
    gradient: "from-warning-light to-accent-orange",
    bgGradient: "from-warning-light to-accent-orange-light"
  },
  TEMPLATE: {
    icon: DocumentTextIcon,
    label: "Template",
    action: "Get Template",
    gradient: "from-accent-pink-light to-error",
    bgGradient: "from-accent-pink-light to-error-light"
  },
  CANVA_DESIGN: {
    icon: ImageIcon,
    label: "Canva Design",
    action: "View Design",
    gradient: "from-primary-500 to-primary-700",
    bgGradient: "from-primary-50 to-primary-100"
  },
};

export function ResourceCard({ resource, variant = "default" }: ResourceCardProps) {
  const config = TYPE_CONFIG[resource.type];
  const Icon = config.icon;
  const href = resource.url || resource.fileUrl || "#";

  if (variant === "compact") {
    return (
      <Card className="group overflow-hidden border-neutral-200 hover:border-neutral-300 hover:shadow-card-hover transition-all duration-300">
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {resource.title}
                </h3>
                {resource.description && (
                  <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5">
                    {resource.description}
                  </p>
                )}
              </div>
              <ArrowTopRightOnSquareIcon className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
            </div>
          </CardContent>
        </a>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden border-neutral-200 hover:border-neutral-300 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1">
      {/* Thumbnail Area */}
      {resource.thumbnailUrl ? (
        <div className="aspect-video bg-neutral-100 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Type badge */}
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${config.gradient} shadow-sm`}>
            {config.label}
          </div>
          {/* Play/action overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className={`h-14 w-14 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm`}>
              <Icon className={`h-6 w-6 text-neutral-800`} />
            </div>
          </div>
        </div>
      ) : (
        <div className={`aspect-video bg-gradient-to-br ${config.bgGradient} flex items-center justify-center relative overflow-hidden`}>
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 left-4 h-20 w-20 rounded-full bg-white/50 blur-2xl" />
            <div className="absolute bottom-4 right-4 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
          </div>
          {/* Icon */}
          <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-10 w-10 text-white" />
          </div>
          {/* Type badge */}
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${config.gradient} shadow-sm`}>
            {config.label}
          </div>
        </div>
      )}

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2 text-lg">
            {resource.title}
          </h3>
          <AdminEditLink resourceId={resource.id} />
        </div>

        {resource.description && (
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        )}

        {/* Action Button */}
        {href !== "#" && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r ${config.gradient} hover:shadow-card-hover transition-all duration-300 hover:scale-105`}
          >
            {config.action}
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
