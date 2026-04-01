"use client";

import { useState, useEffect } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { TrophyIcon, StarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface SkillBadgeBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

interface Skill {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

const BADGE_STYLES = {
  gold: {
    bg: "bg-gradient-to-br from-warning to-warning-light",
    border: "border-warning",
    text: "text-warning-dark",
    icon: StarIcon,
  },
  silver: {
    bg: "bg-gradient-to-br from-neutral-300 to-neutral-400",
    border: "border-neutral-200",
    text: "text-neutral-800",
    icon: TrophyIcon,
  },
  bronze: {
    bg: "bg-gradient-to-br from-accent-orange to-accent-orange",
    border: "border-accent-orange",
    text: "text-accent-orange",
    icon: TrophyIcon,
  },
  blue: {
    bg: "bg-gradient-to-br from-info to-info",
    border: "border-info",
    text: "text-white",
    icon: CheckCircleIcon,
  },
  green: {
    bg: "bg-gradient-to-br from-success to-success",
    border: "border-success",
    text: "text-white",
    icon: CheckCircleIcon,
  },
};

type BadgeStyle = keyof typeof BADGE_STYLES;

export function SkillBadgeBlock({ block, isEditing }: SkillBadgeBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    skillId?: string;
    customTitle?: string;
    customDescription?: string;
    style: BadgeStyle;
    size: "sm" | "md" | "lg";
  };
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const style = content.style || "blue";
  const size = content.size || "md";
  const badgeStyle = BADGE_STYLES[style];
  const IconComponent = badgeStyle.icon;

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Fetch skills for dropdown (if we have a skills API)
  useEffect(() => {
    if (isEditing && skills.length === 0) {
      // Try to fetch skills if the endpoint exists
      fetch("/api/skills")
        .then((res) => {
          if (res.ok) return res.json();
          return { skills: [] };
        })
        .then((data) => {
          setSkills(data.skills || []);
        })
        .catch(() => setSkills([]));
    }
  }, [isEditing, skills.length]);

  // Fetch selected skill details
  useEffect(() => {
    if (content.skillId && !selectedSkill) {
      fetch(`/api/skills/${content.skillId}`)
        .then((res) => {
          if (res.ok) return res.json();
          return { skill: null };
        })
        .then((data) => {
          if (data.skill) setSelectedSkill(data.skill);
        })
        .catch(() => {});
    }
  }, [content.skillId, selectedSkill]);

  const displayTitle =
    content.customTitle || selectedSkill?.name || "Skill Badge";
  const displayDescription =
    content.customDescription || selectedSkill?.description || "";

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-primary-500" />
          <span className="font-medium">Skill Badge</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Style selector */}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Style</label>
            <div className="flex gap-2">
              {(Object.keys(BADGE_STYLES) as BadgeStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateBlock(block.id, { style: s })}
                  className={`h-8 w-8 rounded-full ${BADGE_STYLES[s].bg} ${
                    style === s
                      ? "ring-2 ring-offset-2 ring-primary-500"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  title={s}
                />
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Size</label>
            <div className="flex gap-2">
              {(["sm", "md", "lg"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateBlock(block.id, { size: s })}
                  className={`px-3 py-1 text-sm rounded ${
                    size === s
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skill selector (if skills exist) */}
        {skills.length > 0 && (
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Link to Skill
            </label>
            <select
              value={content.skillId || ""}
              onChange={(e) => {
                const skill = skills.find((s) => s.id === e.target.value);
                updateBlock(block.id, { skillId: e.target.value });
                setSelectedSkill(skill || null);
              }}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">Custom badge (no skill link)</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom title/description */}
        <div className="space-y-2">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Title</label>
            <input
              type="text"
              value={content.customTitle || ""}
              onChange={(e) =>
                updateBlock(block.id, { customTitle: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder={selectedSkill?.name || "Badge title"}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Description
            </label>
            <textarea
              value={content.customDescription || ""}
              onChange={(e) =>
                updateBlock(block.id, { customDescription: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              placeholder={selectedSkill?.description || "Badge description"}
              rows={2}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-sm text-neutral-500 mb-3">Preview:</p>
          <div className="flex flex-col items-center">
            <div
              className={`${sizeClasses[size]} ${badgeStyle.bg} ${badgeStyle.border} border-4 rounded-lg flex items-center justify-center shadow-sm`}
            >
              <IconComponent className={`${iconSizes[size]} ${badgeStyle.text}`} />
            </div>
            <p
              className={`mt-2 font-semibold text-neutral-900 ${textSizes[size]}`}
            >
              {displayTitle}
            </p>
            {displayDescription && (
              <p className="text-xs text-neutral-500 text-center mt-1 max-w-[200px]">
                {displayDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="flex flex-col items-center py-4">
      <div
        className={`${sizeClasses[size]} ${badgeStyle.bg} ${badgeStyle.border} border-4 rounded-lg flex items-center justify-center shadow-sm transform hover:scale-105 transition-transform`}
      >
        <IconComponent className={`${iconSizes[size]} ${badgeStyle.text}`} />
      </div>
      <p className={`mt-3 font-semibold text-neutral-900 ${textSizes[size]}`}>
        {displayTitle}
      </p>
      {displayDescription && (
        <p className="text-sm text-neutral-500 text-center mt-1 max-w-[250px]">
          {displayDescription}
        </p>
      )}
    </div>
  );
}
