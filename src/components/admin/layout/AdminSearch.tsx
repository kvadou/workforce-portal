"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UsersIcon,
  UserPlusIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/icon-button";

interface SearchResult {
  id: string;
  type: "tutor" | "onboarding" | "course" | "resource" | "page";
  title: string;
  subtitle: string | null;
  href: string;
}

const typeConfig: Record<string, { icon: typeof UsersIcon; color: string; label: string }> = {
  tutor: { icon: UsersIcon, color: "text-success bg-success-light", label: "Tutor" },
  onboarding: { icon: UserPlusIcon, color: "text-info bg-info-light", label: "Onboarding" },
  course: { icon: AcademicCapIcon, color: "text-primary-600 bg-primary-50", label: "Course" },
  resource: { icon: BuildingLibraryIcon, color: "text-accent-pink bg-accent-pink-light", label: "Resource" },
  page: { icon: DocumentTextIcon, color: "text-accent-cyan bg-accent-cyan-light", label: "Page" },
};

export default function AdminSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-admin-search", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-admin-search", handleCustomOpen);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const navigateTo = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      navigateTo(results[activeIndex].href);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative max-w-lg mx-auto mt-[15vh]">
        <div className="bg-white rounded-xl shadow-modal border border-neutral-200 overflow-hidden mx-4">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-neutral-100">
            <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tutors, courses, pages..."
              className="flex-1 py-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
            />
            {isLoading && <ArrowPathIcon className="h-4 w-4 text-neutral-400 animate-spin" />}
            <IconButton
              icon={XMarkIcon}
              size="sm"
              aria-label="Close search"
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* Results */}
          {results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto py-2">
              {results.map((result, idx) => {
                const config = typeConfig[result.type];
                const Icon = config.icon;
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => navigateTo(result.href)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                        idx === activeIndex ? "bg-primary-50" : "hover:bg-neutral-50"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-neutral-400 truncate">{result.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex-shrink-0">
                        {config.label}
                      </span>
                      {idx === activeIndex && (
                        <ArrowRightIcon className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Empty state */}
          {query.length >= 2 && !isLoading && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-neutral-400">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-neutral-100 bg-neutral-50/50">
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">&uarr;</kbd>
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-neutral-200">&darr;</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-200">Enter</kbd>
              open
            </span>
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-200">Esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
