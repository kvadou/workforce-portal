"use client";

import Link from "next/link";
import { Page } from "@prisma/client";
import { PageStatusBadge } from "./PageStatusBadge";
import { PageCategory, PageStatus, PAGE_CATEGORY_LABELS, VISIBILITY_LABELS, Visibility } from "@/lib/validations/page";
import {
  PencilSquareIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
  FolderOpenIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";

type PageWithRelations = Page & {
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
  content?: {
    id: string;
    hasDraft: boolean;
    publishedAt: Date | null;
  } | null;
  _count?: {
    children: number;
  };
};

interface PageListItemProps {
  page: PageWithRelations;
  onDelete: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  isDragging?: boolean;
}

export function PageListItem({
  page,
  onDelete,
  onDuplicate,
  isDragging = false,
}: PageListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPublished = page.status === "PUBLISHED";
  const hasDraft = page.content?.hasDraft ?? false;
  const hasChildren = (page._count?.children ?? 0) > 0;

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white rounded-[var(--radius-lg)] border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all ${
        isDragging ? "opacity-50 shadow-dropdown" : ""
      }`}
    >
      {/* Category indicator */}
      <div
        className={`h-12 w-1 rounded-full ${
          page.pageCategory === "TEACHING"
            ? "bg-info"
            : page.pageCategory === "BUSINESS"
            ? "bg-success"
            : page.pageCategory === "ADMIN"
            ? "bg-primary-500"
            : page.pageCategory === "ONBOARDING"
            ? "bg-warning"
            : "bg-neutral-400"
        }`}
      />

      {/* Page info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-neutral-900 truncate">
            {page.title}
          </h3>
          {hasChildren && (
            <span className="flex items-center text-xs text-neutral-500">
              <FolderOpenIcon className="h-3 w-3 mr-1" />
              {page._count?.children}
            </span>
          )}
          {hasDraft && (
            <span className="px-1.5 py-0.5 text-xs bg-warning-light text-warning-dark rounded">
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-body-sm text-neutral-500">
          <span className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
            /{page.slug}
          </span>
          <span className="text-neutral-300">•</span>
          <span>{PAGE_CATEGORY_LABELS[page.pageCategory as PageCategory]}</span>
          {page.organization && (
            <>
              <span className="text-neutral-300">•</span>
              <span className="text-primary-600">{page.organization.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Visibility indicator */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-500">
        {page.visibility === "ADMINS_ONLY" ? (
          <EyeSlashIcon className="h-3 w-3" />
        ) : (
          <EyeIcon className="h-3 w-3" />
        )}
        <span>{VISIBILITY_LABELS[page.visibility as Visibility]}</span>
      </div>

      {/* Status badge */}
      <PageStatusBadge status={page.status as PageStatus} />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Link href={`/admin/pages/${page.id}`}>
          <button
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors"
            title="Edit page"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
        </Link>

        {isPublished && (
          <Link href={`/p/${page.slug}`} target="_blank">
            <button
              className="p-2 text-neutral-400 hover:text-success hover:bg-success-light rounded-[var(--radius-md)] transition-colors"
              title="View published page"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </button>
          </Link>
        )}

        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-[var(--radius-md)] transition-colors"
          >
            <EllipsisVerticalIcon className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-[var(--radius-md)] shadow-dropdown border border-neutral-200 py-1 z-50">
              <button
                onClick={() => {
                  onDuplicate(page.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
                Duplicate
              </button>
              <div className="border-t border-neutral-100 my-1" />
              <button
                onClick={() => {
                  onDelete(page.id, page.title);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error-light flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        <Link href={`/admin/pages/${page.id}`}>
          <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
        </Link>
      </div>
    </div>
  );
}

export default PageListItem;
