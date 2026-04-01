"use client";

import { useState, useCallback } from "react";
import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from "@heroicons/react/24/outline";

// Piece unicode characters
const PIECES: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", // White
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟", // Black
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

interface ChessboardProps {
  fen?: string;
  onMove?: (from: string, to: string) => void;
  interactive?: boolean;
  showCoordinates?: boolean;
  size?: "sm" | "md" | "lg";
  highlightSquares?: string[];
  lastMove?: { from: string; to: string };
  orientation?: "white" | "black";
}

// Parse FEN to get piece positions
function parseFEN(fen: string): Record<string, string> {
  const pieces: Record<string, string> = {};
  const [position] = fen.split(" ");
  const rows = position.split("/");

  rows.forEach((row, rankIndex) => {
    let fileIndex = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        fileIndex += parseInt(char);
      } else {
        const square = FILES[fileIndex] + RANKS[rankIndex];
        pieces[square] = char;
        fileIndex++;
      }
    }
  });

  return pieces;
}

// Standard starting position
const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function Chessboard({
  fen = STARTING_FEN,
  onMove,
  interactive = false,
  showCoordinates = true,
  size = "md",
  highlightSquares = [],
  lastMove,
  orientation = "white",
}: ChessboardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: string } | null>(null);
  const [boardFlipped, setBoardFlipped] = useState(orientation === "black");
  const [scale, setScale] = useState(1);

  const pieces = parseFEN(fen);

  const files = boardFlipped ? [...FILES].reverse() : FILES;
  const ranks = boardFlipped ? [...RANKS].reverse() : RANKS;

  const sizeClasses = {
    sm: "h-64 w-64",
    md: "h-96 w-96",
    lg: "w-[32rem] h-[32rem]",
  };

  const squareSize = {
    sm: "h-8 w-8 text-xl",
    md: "h-12 w-12 text-3xl",
    lg: "h-16 w-16 text-4xl",
  };

  const handleSquareClick = useCallback(
    (square: string) => {
      if (!interactive) return;

      if (selectedSquare) {
        if (selectedSquare !== square) {
          onMove?.(selectedSquare, square);
        }
        setSelectedSquare(null);
      } else if (pieces[square]) {
        setSelectedSquare(square);
      }
    },
    [interactive, selectedSquare, pieces, onMove]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, square: string, piece: string) => {
      if (!interactive) return;
      setDraggedPiece({ square, piece });
      setSelectedSquare(square);
      e.dataTransfer.effectAllowed = "move";
    },
    [interactive]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, square: string) => {
      e.preventDefault();
      if (draggedPiece && draggedPiece.square !== square) {
        onMove?.(draggedPiece.square, square);
      }
      setDraggedPiece(null);
      setSelectedSquare(null);
    },
    [draggedPiece, onMove]
  );

  const isLightSquare = (file: string, rank: string) => {
    const fileIndex = FILES.indexOf(file);
    const rankIndex = RANKS.indexOf(rank);
    return (fileIndex + rankIndex) % 2 === 0;
  };

  const isHighlighted = (square: string) => highlightSquares.includes(square);
  const isLastMoveSquare = (square: string) =>
    lastMove && (lastMove.from === square || lastMove.to === square);
  const isSelected = (square: string) => selectedSquare === square;

  return (
    <div className="inline-flex flex-col gap-2">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBoardFlipped(!boardFlipped)}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Flip board"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale(Math.min(1.5, scale + 0.1))}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
        </div>
        {interactive && (
          <span className="text-xs text-neutral-400">
            Click or drag pieces to move
          </span>
        )}
      </div>

      {/* Board */}
      <div
        className={`relative ${sizeClasses[size]} select-none`}
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {/* Coordinates - Files */}
        {showCoordinates && (
          <div className="absolute -bottom-5 left-0 right-0 flex">
            {files.map((file) => (
              <div
                key={file}
                className={`flex-1 text-center text-xs text-neutral-400`}
              >
                {file}
              </div>
            ))}
          </div>
        )}

        {/* Coordinates - Ranks */}
        {showCoordinates && (
          <div className="absolute -left-4 top-0 bottom-0 flex flex-col">
            {ranks.map((rank) => (
              <div
                key={rank}
                className={`flex-1 flex items-center text-xs text-neutral-400`}
              >
                {rank}
              </div>
            ))}
          </div>
        )}

        {/* Board Grid */}
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden shadow-sm border border-neutral-300">
          {ranks.map((rank) =>
            files.map((file) => {
              const square = file + rank;
              const piece = pieces[square];
              const isLight = isLightSquare(file, rank);

              return (
                <div
                  key={square}
                  className={`
                    ${squareSize[size]} flex items-center justify-center cursor-pointer relative
                    ${isLight ? "bg-warning-light" : "bg-warning-dark"}
                    ${isSelected(square) ? "ring-2 ring-inset ring-info" : ""}
                    ${isHighlighted(square) ? "ring-2 ring-inset ring-success" : ""}
                    ${isLastMoveSquare(square) ? "bg-warning/50" : ""}
                    transition-colors
                  `}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                >
                  {/* Move hint dot */}
                  {selectedSquare && !piece && interactive && (
                    <div className="absolute h-3 w-3 rounded-full bg-black/20" />
                  )}

                  {/* Piece */}
                  {piece && (
                    <span
                      className={`
                        ${piece === piece.toUpperCase() ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" : "text-neutral-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]"}
                        ${interactive ? "cursor-grab active:cursor-grabbing" : ""}
                        ${draggedPiece?.square === square ? "opacity-30" : ""}
                      `}
                      draggable={interactive}
                      onDragStart={(e) => handleDragStart(e, square, piece)}
                    >
                      {PIECES[piece]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Simple mini board for previews
export function MiniChessboard({ fen = STARTING_FEN }: { fen?: string }) {
  const pieces = parseFEN(fen);

  return (
    <div className="h-24 w-24 grid grid-cols-8 grid-rows-8 rounded overflow-hidden border border-neutral-200">
      {RANKS.map((rank) =>
        FILES.map((file) => {
          const square = file + rank;
          const piece = pieces[square];
          const isLight = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0;

          return (
            <div
              key={square}
              className={`h-3 w-3 flex items-center justify-center ${
                isLight ? "bg-warning-light" : "bg-warning"
              }`}
            >
              {piece && (
                <span
                  className={`text-[8px] ${
                    piece === piece.toUpperCase() ? "text-white" : "text-black"
                  }`}
                >
                  {PIECES[piece]}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Chessboard;
