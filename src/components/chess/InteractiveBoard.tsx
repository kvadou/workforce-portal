"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";

// Acme Workforce character piece images
// Adapted from STC Play app - unique per pawn file, per bishop square color
const STORY_PIECES: Record<string, string> = {
  wK: "/assets/pieces/story/Wk.png",
  wQ: "/assets/pieces/story/Wq.png",
  wR: "/assets/pieces/story/Wr.png",
  wN: "/assets/pieces/story/Wn.png",
  wB: "/assets/pieces/story/Wb1.png", // Default light-square bishop
  wP: "/assets/pieces/story/Wp1.png", // Default pawn
  bK: "/assets/pieces/story/Bk.png",
  bQ: "/assets/pieces/story/Bq.png",
  bR: "/assets/pieces/story/Br.png",
  bN: "/assets/pieces/story/Bn.png",
  bB: "/assets/pieces/story/Bb1.png",
  bP: "/assets/pieces/story/Bp1.png",
};

// Classic SVG pieces
const CLASSIC_PIECES: Record<string, string> = {
  wK: "/assets/pieces/classic/wK.svg",
  wQ: "/assets/pieces/classic/wQ.svg",
  wR: "/assets/pieces/classic/wR.svg",
  wN: "/assets/pieces/classic/wN.svg",
  wB: "/assets/pieces/classic/wB.svg",
  wP: "/assets/pieces/classic/wP.svg",
  bK: "/assets/pieces/classic/bK.svg",
  bQ: "/assets/pieces/classic/bQ.svg",
  bR: "/assets/pieces/classic/bR.svg",
  bN: "/assets/pieces/classic/bN.svg",
  bB: "/assets/pieces/classic/bB.svg",
  bP: "/assets/pieces/classic/bP.svg",
};

export type PieceStyle = "classic" | "story";
export type BoardTheme = "default" | "amber" | "green" | "blue";

const BOARD_THEMES: Record<
  BoardTheme,
  { light: string; dark: string }
> = {
  default: { light: "#ffffff", dark: "#34B256" },
  amber: { light: "#fef3c7", dark: "#b45309" },
  green: { light: "#eeeed2", dark: "#769656" },
  blue: { light: "#dee3e6", dark: "#8ca2ad" },
};

interface InteractiveBoardProps {
  fen?: string;
  onMove?: (from: string, to: string, promotion?: string) => boolean | void;
  orientation?: "white" | "black";
  interactive?: boolean;
  showFlipButton?: boolean;
  pieceStyle?: PieceStyle;
  boardTheme?: BoardTheme;
  highlightSquares?: string[];
  arrowColor?: string;
  arrows?: [string, string][];
  boardWidth?: number;
  animationDuration?: number;
  className?: string;
}

export function InteractiveBoard({
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  onMove,
  orientation: initialOrientation = "white",
  interactive = true,
  showFlipButton = true,
  pieceStyle = "classic",
  boardTheme = "default",
  highlightSquares = [],
  arrowColor = "rgba(0, 128, 0, 0.5)",
  arrows = [],
  boardWidth,
  animationDuration = 200,
  className = "",
}: InteractiveBoardProps) {
  const [orientation, setOrientation] = useState<"white" | "black">(
    initialOrientation
  );

  const theme = BOARD_THEMES[boardTheme];

  // Custom square styles for highlights
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    for (const sq of highlightSquares) {
      styles[sq] = {
        background:
          "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }
    return styles;
  }, [highlightSquares]);

  // Custom piece rendering for v5 API
  const customPieces = useMemo(() => {
    const pieces: Record<string, () => React.JSX.Element> = {};
    const pieceMap = pieceStyle === "story" ? STORY_PIECES : CLASSIC_PIECES;

    for (const [key, src] of Object.entries(pieceMap)) {
      pieces[key] = () => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={key}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
          }}
          draggable={false}
        />
      );
    }
    return pieces;
  }, [pieceStyle]);

  const handlePieceDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: { piece: { pieceType: string }; sourceSquare: string; targetSquare: string | null }) => {
      if (!interactive || !onMove || !targetSquare) return false;
      // Auto-promote to queen
      const pieceStr = piece.pieceType;
      const isPromotion =
        pieceStr[1] === "P" &&
        ((pieceStr[0] === "w" && targetSquare[1] === "8") ||
          (pieceStr[0] === "b" && targetSquare[1] === "1"));
      const result = onMove(
        sourceSquare,
        targetSquare,
        isPromotion ? "q" : undefined
      );
      return result !== false;
    },
    [interactive, onMove]
  );

  return (
    <div
      className={`inline-flex flex-col gap-2 ${className}`}
      style={boardWidth ? { width: boardWidth } : undefined}
    >
      {showFlipButton && (
        <div className="flex items-center justify-end">
          <button
            onClick={() =>
              setOrientation((o) => (o === "white" ? "black" : "white"))
            }
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Flip board"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      <Chessboard
        options={{
          position: fen,
          onPieceDrop: handlePieceDrop as any,
          boardOrientation: orientation,
          animationDurationInMs: animationDuration,
          allowDragging: interactive,
          boardStyle: {
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          },
          darkSquareStyle: { backgroundColor: theme.dark },
          lightSquareStyle: { backgroundColor: theme.light },
          squareStyles: customSquareStyles,
          pieces: customPieces,
          arrows: arrows.map((a) => ({
            startSquare: a[0],
            endSquare: a[1],
            color: arrowColor,
          })),
        }}
      />
    </div>
  );
}

export default InteractiveBoard;
