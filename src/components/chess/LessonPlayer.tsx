"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LightBulbIcon,
  ArrowPathIcon,
  StarIcon,
  CheckCircleIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import type { LevelGoalType } from "@prisma/client";

/**
 * Teaching FENs may omit kings (e.g. just a pawn on e2).
 * chess.js requires both kings, so we inject them on unused squares
 * to keep the engine happy without changing the visible position.
 */
function ensureKings(fen: string): string {
  const parts = fen.split(" ");
  let board = parts[0];

  const hasWhiteKing = board.includes("K");
  const hasBlackKing = board.includes("k");

  if (hasWhiteKing && hasBlackKing) return fen;

  // Expand FEN rows to an 8x8 grid so we can find empty squares
  const rows = board.split("/").map((row) => {
    let expanded = "";
    for (const ch of row) {
      if (/\d/.test(ch)) expanded += ".".repeat(Number(ch));
      else expanded += ch;
    }
    return expanded;
  });

  const placeKing = (king: string, preferredRow: number): void => {
    // Try corners / edges of the preferred row first, then scan outward
    const colOrder = [0, 7, 1, 6, 2, 5, 3, 4];
    const rowOrder = preferredRow === 0
      ? [0, 1, 2, 3, 4, 5, 6, 7]
      : [7, 6, 5, 4, 3, 2, 1, 0];

    for (const r of rowOrder) {
      for (const c of colOrder) {
        if (rows[r][c] === ".") {
          rows[r] = rows[r].substring(0, c) + king + rows[r].substring(c + 1);
          return;
        }
      }
    }
  };

  if (!hasWhiteKing) placeKing("K", 7); // white king near rank 1
  if (!hasBlackKing) placeKing("k", 0); // black king near rank 8

  // Compress rows back to FEN notation
  const compressed = rows.map((row) => {
    let result = "";
    let emptyCount = 0;
    for (const ch of row) {
      if (ch === ".") {
        emptyCount++;
      } else {
        if (emptyCount) { result += emptyCount; emptyCount = 0; }
        result += ch;
      }
    }
    if (emptyCount) result += emptyCount;
    return result;
  });

  parts[0] = compressed.join("/");
  return parts.join(" ");
}

interface LessonLevel {
  id: string;
  order: number;
  fen: string;
  goal: string;
  goalType: LevelGoalType;
  targetSquares: string[];
  playerColor: string;
  hintText?: string | null;
}

interface LessonPlayerProps {
  lessonTitle: string;
  levels: LessonLevel[];
  completedLevels?: number;
  onLevelComplete?: (levelIndex: number) => void;
  onLessonComplete?: () => void;
  boardWidth?: number;
  className?: string;
}

type LevelState = "playing" | "complete" | "hint";

export function LessonPlayer({
  lessonTitle,
  levels,
  completedLevels = 0,
  onLevelComplete,
  onLessonComplete,
  boardWidth,
  className = "",
}: LessonPlayerProps) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(() =>
    Math.min(completedLevels, levels.length - 1)
  );
  const [levelState, setLevelState] = useState<LevelState>("playing");
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [showHint, setShowHint] = useState(false);
  const [capturedTargets, setCapturedTargets] = useState<Set<string>>(
    new Set()
  );
  const [customStyles, setCustomStyles] = useState<
    Record<string, React.CSSProperties>
  >({});

  const currentLevel = levels[currentLevelIdx];
  const isLessonDone = currentLevelIdx >= levels.length;

  // Reset board when level changes
  useEffect(() => {
    if (!currentLevel) return;
    const chess = new Chess(ensureKings(currentLevel.fen));
    setGame(chess);
    setLevelState("playing");
    setShowHint(false);
    setCapturedTargets(new Set());
    setCustomStyles({});
  }, [currentLevel]);

  // Build target square highlights
  const targetStyles = useCallback(() => {
    if (!currentLevel) return {};
    const styles: Record<string, React.CSSProperties> = {};

    for (const sq of currentLevel.targetSquares) {
      if (capturedTargets.has(sq)) continue;
      styles[sq] = {
        background:
          "radial-gradient(circle, rgba(234, 179, 8, 0.6) 40%, transparent 40%)",
        boxShadow: "inset 0 0 0 2px rgba(234, 179, 8, 0.8)",
      };
    }

    return styles;
  }, [currentLevel, capturedTargets]);

  const checkGoalComplete = useCallback(
    (chess: Chess, from: string, to: string): boolean => {
      if (!currentLevel) return false;

      switch (currentLevel.goalType) {
        case "REACH_SQUARE":
          return currentLevel.targetSquares.includes(to);

        case "CAPTURE_TARGETS": {
          const newCaptured = new Set(capturedTargets);
          if (currentLevel.targetSquares.includes(to)) {
            newCaptured.add(to);
            setCapturedTargets(newCaptured);
          }
          return currentLevel.targetSquares.every((sq) =>
            newCaptured.has(sq)
          );
        }

        case "CHECKMATE":
          return chess.isCheckmate();

        case "SEQUENCE":
          // For sequence goals, any check on the king counts
          return chess.isCheck();

        case "AVOID_CAPTURE":
          // Move made without being in check after - success
          return !chess.isCheck();

        case "CUSTOM":
          // Custom levels are always "done" after one move for now
          return true;

        default:
          return false;
      }
    },
    [currentLevel, capturedTargets]
  );

  const handleMove = useCallback(
    ({ piece, sourceSquare, targetSquare }: { piece: { pieceType: string }; sourceSquare: string; targetSquare: string | null }) => {
      if (levelState !== "playing" || !currentLevel || !targetSquare) return false;

      const pieceStr = piece.pieceType;

      // Validate the piece color matches the player
      const isWhitePiece = pieceStr[0] === "w";
      const playerIsWhite = currentLevel.playerColor === "white";
      if (isWhitePiece !== playerIsWhite) return false;

      const newGame = new Chess(ensureKings(game.fen()));

      try {
        const isPromotion =
          pieceStr[1] === "P" &&
          ((pieceStr[0] === "w" && targetSquare[1] === "8") ||
            (pieceStr[0] === "b" && targetSquare[1] === "1"));

        newGame.move({
          from: sourceSquare as Square,
          to: targetSquare as Square,
          promotion: isPromotion ? "q" : undefined,
        });
      } catch {
        return false;
      }

      setGame(newGame);

      const goalMet = checkGoalComplete(newGame, sourceSquare, targetSquare);

      if (goalMet) {
        setLevelState("complete");
        setCustomStyles({
          [targetSquare]: {
            backgroundColor: "rgba(34, 197, 94, 0.5)",
          },
        });
        onLevelComplete?.(currentLevelIdx);
      }

      return true;
    },
    [
      levelState,
      currentLevel,
      game,
      currentLevelIdx,
      onLevelComplete,
      checkGoalComplete,
    ]
  );

  const goToNextLevel = useCallback(() => {
    const nextIdx = currentLevelIdx + 1;
    if (nextIdx >= levels.length) {
      onLessonComplete?.();
      return;
    }
    setCurrentLevelIdx(nextIdx);
  }, [currentLevelIdx, levels.length, onLessonComplete]);

  const goToPrevLevel = useCallback(() => {
    if (currentLevelIdx <= 0) return;
    setCurrentLevelIdx(currentLevelIdx - 1);
  }, [currentLevelIdx]);

  const resetLevel = useCallback(() => {
    if (!currentLevel) return;
    setGame(new Chess(ensureKings(currentLevel.fen)));
    setLevelState("playing");
    setShowHint(false);
    setCapturedTargets(new Set());
    setCustomStyles({});
  }, [currentLevel]);

  if (!currentLevel) {
    // Lesson complete celebration
    return (
      <div className={`flex flex-col items-center gap-6 py-12 ${className}`}>
        <div className="h-16 w-16 rounded-lg bg-success-light flex items-center justify-center">
          <TrophyIcon className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800">
          Lesson Complete!
        </h2>
        <p className="text-neutral-600">{lessonTitle} - All levels done!</p>
        <div className="flex gap-2">
          {levels.map((_, i) => (
            <StarIcon
              key={i}
              className="h-6 w-6 text-warning fill-yellow-400"
            />
          ))}
        </div>
      </div>
    );
  }

  const allSquareStyles = {
    ...targetStyles(),
    ...customStyles,
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Level progress */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-sm font-medium text-neutral-600">
          {lessonTitle}
        </span>
        <div className="flex gap-1 ml-auto">
          {levels.map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full transition-colors ${
                i < completedLevels || (i === currentLevelIdx && levelState === "complete")
                  ? "bg-success"
                  : i === currentLevelIdx
                  ? "bg-info"
                  : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-neutral-400">
          {currentLevelIdx + 1}/{levels.length}
        </span>
      </div>

      {/* Goal text */}
      <div className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-lg">
        <p className="text-primary-800 font-medium">{currentLevel.goal}</p>
      </div>

      {/* Success banner */}
      {levelState === "complete" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-success-light border border-success rounded-lg w-full">
          <CheckCircleIcon className="h-5 w-5 text-success" />
          <span className="text-success-dark font-medium">Level complete!</span>
          <button
            onClick={goToNextLevel}
            className="ml-auto flex items-center gap-1 px-3 py-1 bg-success text-white rounded-lg hover:bg-success-dark transition-colors text-sm font-medium"
          >
            {currentLevelIdx + 1 < levels.length ? (
              <>
                Next <ChevronRightIcon className="h-4 w-4" />
              </>
            ) : (
              <>
                <TrophyIcon className="h-4 w-4" /> Finish
              </>
            )}
          </button>
        </div>
      )}

      {/* Hint */}
      {showHint && currentLevel.hintText && (
        <div className="flex items-start gap-2 px-4 py-2 bg-warning-light border border-warning rounded-lg w-full">
          <LightBulbIcon className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <span className="text-warning-dark text-sm">
            {currentLevel.hintText}
          </span>
        </div>
      )}

      {/* Board */}
      <div style={boardWidth ? { width: boardWidth } : { width: "100%", maxWidth: 480 }}>
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: handleMove as any,
            boardOrientation:
              currentLevel.playerColor === "white" ? "white" : "black",
            allowDragging: levelState === "playing",
            animationDurationInMs: 200,
            boardStyle: {
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
            darkSquareStyle: { backgroundColor: "#6aae47" },
            lightSquareStyle: { backgroundColor: "#ffffff" },
            squareStyles: allSquareStyles,
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={goToPrevLevel}
          disabled={currentLevelIdx === 0}
          className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous level"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <button
          onClick={resetLevel}
          className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors text-sm"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Reset
        </button>

        {levelState === "playing" && currentLevel.hintText && (
          <button
            onClick={() => setShowHint(true)}
            className="flex items-center gap-2 px-3 py-2 bg-warning-light border border-warning text-warning-dark rounded-lg hover:bg-warning-light transition-colors text-sm"
          >
            <LightBulbIcon className="h-4 w-4" />
            Hint
          </button>
        )}

        <button
          onClick={goToNextLevel}
          disabled={
            levelState !== "complete" &&
            currentLevelIdx >= completedLevels
          }
          className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next level"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default LessonPlayer;
