"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useForumCategories, useForumPosts } from "@/hooks/useForum";
import { PostCard } from "@/components/forum/PostCard";

export function ForumClient() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useForumCategories();
  const { data: postsData, isLoading: postsLoading } = useForumPosts({
    categorySlug: selectedCategory || undefined,
    limit: 20,
  });

  const posts = postsData?.posts || [];

  return (
    <DashboardLayout>
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 p-4 md:p-5 mb-6 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <ChatBubbleLeftIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Discussion Forums</h1>
                <p className="text-white/80 text-sm">
                  Connect with fellow tutors, ask questions, and share knowledge
                </p>
              </div>
            </div>
            <Link href="/forum/new">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur border-0">
                <PlusCircleIcon className="w-4 h-4 mr-1.5" />
                New Post
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* MagnifyingGlassIcon */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="py-4">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="MagnifyingGlassIcon discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-neutral-50"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Categories */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                <FolderOpenIcon className="w-5 h-5 text-primary-500" />
                Categories
              </h2>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <ArrowPathIcon className="w-5 h-5 text-primary-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors min-h-[44px] ${
                      selectedCategory === null
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100"
                    }`}
                  >
                    All Discussions
                  </button>
                  {categories?.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.slug)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-between min-h-[44px] ${
                        selectedCategory === category.slug
                          ? "bg-primary-500 text-white shadow-sm"
                          : "text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100"
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className={`text-xs ${selectedCategory === category.slug ? "text-white/80" : "text-neutral-400"}`}>
                        {category._count?.posts || 0}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Posts */}
        <div className="flex-1">
          {postsLoading ? (
            <div className="flex items-center justify-center py-20">
              <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <ChatBubbleLeftIcon className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No discussions yet
                </h3>
                <p className="text-neutral-500 mb-4">
                  Be the first to start a conversation!
                </p>
                <Link href="/forum/new">
                  <Button className="gap-2">
                    <PlusCircleIcon className="w-4 h-4" />
                    Create First Post
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts
                .filter(
                  (post) =>
                    !searchQuery ||
                    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    post.content.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    showCategory={!selectedCategory}
                  />
                ))}
            </div>
          )}

          {/* Pagination placeholder */}
          {postsData && postsData.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-sm text-neutral-500">
                Page {postsData.page} of {postsData.totalPages}
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
