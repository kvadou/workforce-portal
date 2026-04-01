"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import { Squares2X2Icon, ArrowPathIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

interface ChessBoardBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

// Standard piece symbols
const PIECES: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

// Parse FEN string to board array
function fenToBoard(fen: string): string[][] {
  const rows = fen.split("/");
  const board: string[][] = [];

  for (const row of rows) {
    const boardRow: string[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        // Empty squares
        for (let i = 0; i < parseInt(char); i++) {
          boardRow.push("");
        }
      } else {
        boardRow.push(char);
      }
    }
    board.push(boardRow);
  }

  return board;
}

// Convert board array back to FEN
function boardToFen(board: string[][]): string {
  return board
    .map((row) => {
      let fenRow = "";
      let emptyCount = 0;

      for (const square of row) {
        if (square === "") {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fenRow += emptyCount;
            emptyCount = 0;
          }
          fenRow += square;
        }
      }

      if (emptyCount > 0) {
        fenRow += emptyCount;
      }

      return fenRow;
    })
    .join("/");
}

export function ChessBoardBlock({ block, isEditing }: ChessBoardBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    fen: string;
    title?: string;
    caption?: string;
    showCoordinates: boolean;
    flipped: boolean;
    size: "sm" | "md" | "lg";
    highlightSquares?: string[];
  };

  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  const fen = content.fen || STARTING_FEN;
  const board = fenToBoard(fen);
  const showCoordinates = content.showCoordinates !== false;
  const flipped = content.flipped || false;
  const size = content.size || "md";

  const sizeClasses = {
    sm: "w-48",
    md: "w-72",
    lg: "w-96",
  };

  const squareSizes = {
    sm: "h-6 w-6 text-lg",
    md: "h-9 w-9 text-2xl",
    lg: "h-12 w-12 text-3xl",
  };

  const files = flipped
    ? ["h", "g", "f", "e", "d", "c", "b", "a"]
    : ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];

  const displayBoard = flipped ? [...board].reverse().map((row) => [...row].reverse()) : board;

  const handleSquareClick = (row: number, col: number) => {
    if (!isEditing) return;

    const actualRow = flipped ? 7 - row : row;
    const actualCol = flipped ? 7 - col : col;
    const newBoard = board.map((r) => [...r]);

    if (selectedPiece === "clear") {
      newBoard[actualRow][actualCol] = "";
    } else if (selectedPiece) {
      newBoard[actualRow][actualCol] = selectedPiece;
    }

    updateBlock(block.id, { fen: boardToFen(newBoard) });
  };

  const resetBoard = () => {
    updateBlock(block.id, { fen: STARTING_FEN });
  };

  const clearBoard = () => {
    updateBlock(block.id, { fen: "8/8/8/8/8/8/8/8" });
  };

  const copyFen = () => {
    navigator.clipboard.writeText(fen);
  };

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Squares2X2Icon className="h-5 w-5 text-primary-500" />
          <span className="font-medium">Chess Board</span>
        </div>

        {/* Settings row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Size:</span>
            {(["sm", "md", "lg"] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateBlock(block.id, { size: s })}
                className={`px-2 py-1 text-xs rounded ${
                  size === s
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCoordinates}
              onChange={(e) =>
                updateBlock(block.id, { showCoordinates: e.target.checked })
              }
              className="rounded"
            />
            Coordinates
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flipped}
              onChange={(e) =>
                updateBlock(block.id, { flipped: e.target.checked })
              }
              className="rounded"
            />
            Flip board
          </label>
        </div>

        {/* Piece palette */}
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">
            Select piece, then click squares:
          </p>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {["K", "Q", "R", "B", "N", "P"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPiece(selectedPiece === p ? null : p)}
                  className={`h-8 w-8 text-xl flex items-center justify-center rounded ${
                    selectedPiece === p
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 hover:bg-neutral-200"
                  }`}
                >
                  {PIECES[p]}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {["k", "q", "r", "b", "n", "p"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPiece(selectedPiece === p ? null : p)}
                  className={`h-8 w-8 text-xl flex items-center justify-center rounded ${
                    selectedPiece === p
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 hover:bg-neutral-200"
                  }`}
                >
                  {PIECES[p]}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                setSelectedPiece(selectedPiece === "clear" ? null : "clear")
              }
              className={`px-2 py-1 text-xs rounded ${
                selectedPiece === "clear"
                  ? "bg-error text-white"
                  : "bg-neutral-100 hover:bg-neutral-200"
              }`}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Title/Caption */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Title</label>
            <input
              type="text"
              value={content.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="Position title"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Caption
            </label>
            <input
              type="text"
              value={content.caption || ""}
              onChange={(e) =>
                updateBlock(block.id, { caption: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="Explain the position..."
            />
          </div>
        </div>

        {/* FEN input */}
        <div>
          <label className="block text-sm text-neutral-500 mb-1">
            FEN (piece placement)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={fen}
              onChange={(e) => updateBlock(block.id, { fen: e.target.value })}
              className="flex-1 px-3 py-2 text-sm font-mono border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button
              onClick={copyFen}
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded"
              title="Copy FEN"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={resetBoard}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Starting Position
          </button>
          <button
            onClick={clearBoard}
            className="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded"
          >
            Clear Board
          </button>
        </div>

        {/* Board preview */}
        <div className="flex justify-center">
          <div className={sizeClasses[size]}>
            {content.title && (
              <p className="text-center font-medium text-neutral-900 mb-2">
                {content.title}
              </p>
            )}
            <div className="border-2 border-neutral-800 rounded overflow-hidden">
              {displayBoard.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {showCoordinates && (
                    <div className="w-4 flex items-center justify-center text-xs text-neutral-500 bg-neutral-100">
                      {ranks[rowIndex]}
                    </div>
                  )}
                  {row.map((piece, colIndex) => {
                    const isLight = (rowIndex + colIndex) % 2 === 0;
                    return (
                      <button
                        key={colIndex}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                        className={`${squareSizes[size]} flex items-center justify-center ${
                          isLight ? "bg-warning-light" : "bg-warning-dark"
                        } hover:opacity-80`}
                      >
                        {piece && (
                          <span
                            className={
                              piece === piece.toUpperCase()
                                ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                                : "text-neutral-900"
                            }
                          >
                            {PIECES[piece]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {showCoordinates && (
                <div className="flex">
                  <div className="w-4 bg-neutral-100" />
                  {files.map((file) => (
                    <div
                      key={file}
                      className={`${squareSizes[size].split(" ")[0]} flex items-center justify-center text-xs text-neutral-500 bg-neutral-100`}
                    >
                      {file}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {content.caption && (
              <p className="text-center text-sm text-neutral-600 mt-2">
                {content.caption}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="flex flex-col items-center my-6">
      <div className={sizeClasses[size]}>
        {content.title && (
          <p className="text-center font-medium text-neutral-900 mb-2">
            {content.title}
          </p>
        )}
        <div className="border-2 border-neutral-800 rounded overflow-hidden shadow-sm">
          {displayBoard.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {showCoordinates && (
                <div className="w-4 flex items-center justify-center text-xs text-neutral-500 bg-neutral-100">
                  {ranks[rowIndex]}
                </div>
              )}
              {row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                return (
                  <div
                    key={colIndex}
                    className={`${squareSizes[size]} flex items-center justify-center ${
                      isLight ? "bg-warning-light" : "bg-warning-dark"
                    }`}
                  >
                    {piece && (
                      <span
                        className={
                          piece === piece.toUpperCase()
                            ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                            : "text-neutral-900"
                        }
                      >
                        {PIECES[piece]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {showCoordinates && (
            <div className="flex">
              <div className="w-4 bg-neutral-100" />
              {files.map((file) => (
                <div
                  key={file}
                  className={`${squareSizes[size].split(" ")[0]} flex items-center justify-center text-xs text-neutral-500 bg-neutral-100`}
                >
                  {file}
                </div>
              ))}
            </div>
          )}
        </div>
        {content.caption && (
          <p className="text-center text-sm text-neutral-600 mt-2">
            {content.caption}
          </p>
        )}
      </div>
    </div>
  );
}
