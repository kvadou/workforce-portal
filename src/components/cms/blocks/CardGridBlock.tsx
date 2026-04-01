"use client";

import { useState, useCallback } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  PlusIcon,
  TrashIcon,
  PhotoIcon as ImageIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface Card {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
}

interface CardGridBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function CardGridBlock({ block, isEditing }: CardGridBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as { cards: Card[]; columns: 2 | 3 | 4 };
  const [uploadingCard, setUploadingCard] = useState<string | null>(null);

  const cards = content.cards || [];
  const columns = content.columns || 3;

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const addCard = () => {
    const newCard: Card = {
      id: `card_${Date.now()}`,
      title: "Card Title",
      description: "Card description",
      image: "",
      link: "",
    };
    updateBlock(block.id, { cards: [...cards, newCard] });
  };

  const updateCard = (id: string, updates: Partial<Card>) => {
    updateBlock(block.id, {
      cards: cards.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      ),
    });
  };

  const removeCard = (id: string) => {
    updateBlock(block.id, {
      cards: cards.filter((card) => card.id !== id),
    });
  };

  const handleImageUpload = useCallback(
    async (cardId: string, file: File) => {
      if (!file.type.startsWith("image/")) return;

      setUploadingCard(cardId);
      try {
        const urlResponse = await fetch(
          `/api/media/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        );
        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, fileUrl } = await urlResponse.json();

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        updateCard(cardId, { image: fileUrl });
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploadingCard(null);
      }
    },
    [updateCard]
  );

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Column selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Columns:</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => updateBlock(block.id, { columns: n })}
              className={`px-3 py-1 text-sm rounded ${
                columns === n
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className={`grid ${gridCols[columns]} gap-4`}>
          {cards.map((card) => (
            <div
              key={card.id}
              className="border border-neutral-200 rounded-lg overflow-hidden"
            >
              {/* Image */}
              <div className="aspect-video bg-neutral-100 relative">
                {card.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => updateCard(card.id, { image: "" })}
                      className="absolute top-2 right-2 h-6 w-6 bg-error text-white rounded-lg flex items-center justify-center"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-200 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(card.id, file);
                      }}
                    />
                    {uploadingCard === card.id ? (
                      <ArrowPathIcon className="h-6 w-6 text-neutral-400 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-neutral-400" />
                        <span className="text-xs text-neutral-400 mt-1">
                          Add image
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => updateCard(card.id, { title: e.target.value })}
                  className="w-full px-2 py-1 text-sm font-medium border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="Card title"
                />
                <textarea
                  value={card.description}
                  onChange={(e) =>
                    updateCard(card.id, { description: e.target.value })
                  }
                  className="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                  placeholder="Description"
                  rows={2}
                />
                <input
                  type="text"
                  value={card.link}
                  onChange={(e) => updateCard(card.id, { link: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="Link URL (optional)"
                />
                <button
                  onClick={() => removeCard(card.id)}
                  className="text-xs text-error hover:underline"
                >
                  Remove card
                </button>
              </div>
            </div>
          ))}

          {/* Add card button */}
          <button
            onClick={addCard}
            className="min-h-[200px] border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <PlusIcon className="h-8 w-8 text-neutral-400" />
            <span className="text-sm text-neutral-500 mt-1">Add Card</span>
          </button>
        </div>
      </div>
    );
  }

  // View mode
  if (cards.length === 0) return null;

  return (
    <div className={`grid ${gridCols[columns]} gap-6 my-6`}>
      {cards.map((card) => {
        const CardWrapper = card.link ? "a" : "div";
        const cardProps = card.link
          ? { href: card.link, target: "_blank", rel: "noopener noreferrer" }
          : {};

        return (
          <CardWrapper
            key={card.id}
            {...cardProps}
            className="border border-neutral-200 rounded-xl overflow-hidden hover:shadow-card-hover transition-shadow bg-white"
          >
            {card.image && (
              <div className="aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-neutral-900">{card.title}</h3>
              {card.description && (
                <p className="text-sm text-neutral-600 mt-1">
                  {card.description}
                </p>
              )}
            </div>
          </CardWrapper>
        );
      })}
    </div>
  );
}
