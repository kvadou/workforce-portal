"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import {
  LightBulbIcon,
  ForwardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface PuzzleSolverProps {
  puzzleId: string;
  fen: string;
  moves: string; // Space-separated UCI moves (e.g., "e2e4 d7d5 e4d5")
  rating?: number;
  themes?: string[];
  onComplete?: (result: {
    solved: boolean;
    usedHint: boolean;
    moveCount: number;
    timeMs: number;
  }) => void;
  onNext?: () => void;
  boardWidth?: number;
  className?: string;
}

type PuzzleState = "setup" | "playing" | "correct" | "incorrect";

function uciToMove(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

export function PuzzleSolver({
  puzzleId,
  fen,
  moves,
  rating,
  themes = [],
  onComplete,
  onNext,
  boardWidth,
  className = "",
}: PuzzleSolverProps) {
  const [game, setGame] = useState<Chess>(() => new Chess(fen));
  const [state, setState] = useState<PuzzleState>("setup");
  const [moveIndex, setMoveIndex] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [feedbackSquares, setFeedbackSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const startTime = useRef<number>(Date.now());

  const moveList = moves.split(" ").filter(Boolean);
  // Player color: puzzle starts with opponent's move, so player is opposite
  const playerColor = game.turn() === "w" ? "black" : "white";
  // After setup move, this flips
  const [boardOrientation, setBoardOrientation] = useState<
    "white" | "black"
  >("white");

  // Play the opponent's first move (setup move) on mount
  useEffect(() => {
    if (state !== "setup") return;

    const timer = setTimeout(() => {
      if (moveList.length === 0) return;

      const setupGame = new Chess(fen);
      const setupMove = uciToMove(moveList[0]);

      try {
        const result = setupGame.move({
          from: setupMove.from as Square,
          to: setupMove.to as Square,
          promotion: setupMove.promotion as any,
        });

        if (result) {
          setGame(setupGame);
          setLastMove({ from: setupMove.from, to: setupMove.to });
          setMoveIndex(1);
          setState("playing");
          // Set orientation based on who plays next (the solver)
          setBoardOrientation(setupGame.turn() === "w" ? "white" : "black");
          startTime.current = Date.now();
        }
      } catch {
        // If setup move fails, let user play from the start
        setState("playing");
        setBoardOrientation(setupGame.turn() === "w" ? "white" : "black");
        startTime.current = Date.now();
      }
    }, 600); // Short delay for the setup move animation

    return () => clearTimeout(timer);
  }, [fen, moves, state, moveList]);

  const playOpponentMove = useCallback(
    (currentGame: Chess, nextMoveIdx: number) => {
      if (nextMoveIdx >= moveList.length) return;

      setTimeout(() => {
        const oppMove = uciToMove(moveList[nextMoveIdx]);
        const newGame = new Chess(currentGame.fen());

        try {
          newGame.move({
            from: oppMove.from as Square,
            to: oppMove.to as Square,
            promotion: oppMove.promotion as any,
          });
          setGame(newGame);
          setLastMove({ from: oppMove.from, to: oppMove.to });
          setMoveIndex(nextMoveIdx + 1);
        } catch {
          // Opponent move failed - puzzle might be complete
        }
      }, 400);
    },
    [moveList]
  );

  const handleMove = useCallback(
    ({ piece, sourceSquare, targetSquare }: { piece: { pieceType: string }; sourceSquare: string; targetSquare: string | null }) => {
      if (state !== "playing" || !targetSquare) return false;

      const expectedMove = moveList[moveIndex];
      if (!expectedMove) return false;

      const expected = uciToMove(expectedMove);
      const pieceStr = piece.pieceType;

      // Check if this move matches the expected solution
      const isPromotion =
        pieceStr[1] === "P" &&
        ((pieceStr[0] === "w" && targetSquare[1] === "8") ||
          (pieceStr[0] === "b" && targetSquare[1] === "1"));
      const promotion = isPromotion ? expected.promotion || "q" : undefined;

      const isCorrect =
        sourceSquare === expected.from &&
        targetSquare === expected.to &&
        (!expected.promotion || promotion === expected.promotion);

      if (isCorrect) {
        // Make the correct move
        const newGame = new Chess(game.fen());
        try {
          newGame.move({
            from: sourceSquare as Square,
            to: targetSquare as Square,
            promotion: promotion as any,
          });
        } catch {
          return false;
        }

        setGame(newGame);
        setLastMove({ from: sourceSquare, to: targetSquare });
        setMoveCount((c) => c + 1);
        setHintSquare(null);

        const nextIdx = moveIndex + 1;

        // Show green highlight
        setFeedbackSquares({
          [targetSquare]: {
            backgroundColor: "rgba(34, 197, 94, 0.4)",
          },
        });

        // Check if puzzle is complete (no more user moves)
        if (nextIdx >= moveList.length) {
          // Puzzle solved!
          setState("correct");
          const timeMs = Date.now() - startTime.current;
          onComplete?.({
            solved: true,
            usedHint,
            moveCount: moveCount + 1,
            timeMs,
          });
        } else if (nextIdx + 1 >= moveList.length) {
          // Only opponent move left, and no user move after - solved!
          setMoveIndex(nextIdx);
          playOpponentMove(newGame, nextIdx);
          setTimeout(() => {
            setState("correct");
            const timeMs = Date.now() - startTime.current;
            onComplete?.({
              solved: true,
              usedHint,
              moveCount: moveCount + 1,
              timeMs,
            });
          }, 800);
        } else {
          // Play opponent's response, then wait for next user move
          setMoveIndex(nextIdx);
          playOpponentMove(newGame, nextIdx);
        }

        return true;
      } else {
        // Wrong move - show red flash
        setFeedbackSquares({
          [targetSquare]: {
            backgroundColor: "rgba(239, 68, 68, 0.5)",
          },
        });
        setTimeout(() => setFeedbackSquares({}), 800);

        // After 5 wrong attempts, mark as failed
        setMoveCount((c) => {
          const newCount = c + 1;
          if (newCount >= 5) {
            setState("incorrect");
            const timeMs = Date.now() - startTime.current;
            onComplete?.({
              solved: false,
              usedHint,
              moveCount: newCount,
              timeMs,
            });
          }
          return newCount;
        });

        return false;
      }
    },
    [
      state,
      moveList,
      moveIndex,
      game,
      moveCount,
      usedHint,
      onComplete,
      playOpponentMove,
    ]
  );

  const showHint = useCallback(() => {
    if (state !== "playing" || moveIndex >= moveList.length) return;
    setUsedHint(true);
    const expected = uciToMove(moveList[moveIndex]);
    setHintSquare(expected.from);
  }, [state, moveIndex, moveList]);

  const retry = useCallback(() => {
    setGame(new Chess(fen));
    setState("setup");
    setMoveIndex(0);
    setUsedHint(false);
    setMoveCount(0);
    setHintSquare(null);
    setLastMove(null);
    setFeedbackSquares({});
  }, [fen]);

  const elapsedMs = Date.now() - startTime.current;
  const elapsedSec = Math.floor(elapsedMs / 1000);

  // Build custom square styles
  const customSquareStyles: Record<string, React.CSSProperties> = {
    ...feedbackSquares,
  };
  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      ...customSquareStyles[lastMove.from],
      backgroundColor: "rgba(255, 255, 0, 0.3)",
    };
    customSquareStyles[lastMove.to] = {
      ...customSquareStyles[lastMove.to],
      backgroundColor: "rgba(255, 255, 0, 0.3)",
    };
  }
  if (hintSquare) {
    customSquareStyles[hintSquare] = {
      ...customSquareStyles[hintSquare],
      backgroundColor: "rgba(59, 130, 246, 0.5)",
      boxShadow: "inset 0 0 0 3px rgba(59, 130, 246, 0.8)",
    };
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 w-full">
        {rating && (
          <span className="text-sm font-medium text-neutral-600">
            Rating: {rating}
          </span>
        )}
        {themes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {themes.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full"
              >
                {t.replace(/([A-Z])/g, " $1").trim()}
              </span>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 text-sm text-neutral-500">
          <ClockIcon className="h-4 w-4" />
          <span>
            {Math.floor(elapsedSec / 60)}:
            {(elapsedSec % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Status banner */}
      {state === "correct" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-success-light border border-success rounded-lg w-full">
          <CheckCircleIcon className="h-5 w-5 text-success" />
          <span className="text-success-dark font-medium">
            Correct! Puzzle solved.
          </span>
        </div>
      )}
      {state === "incorrect" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-error-light border border-error rounded-lg w-full">
          <XCircleIcon className="h-5 w-5 text-error" />
          <span className="text-error-dark font-medium">
            Not quite. Try again?
          </span>
        </div>
      )}
      {state === "playing" && (
        <div className="text-sm text-neutral-600 w-full">
          {boardOrientation === "white" ? "White" : "Black"} to move — find
          the best move!
        </div>
      )}

      {/* Board */}
      <div style={boardWidth ? { width: boardWidth } : { width: "100%", maxWidth: 480 }}>
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: handleMove as any,
            boardOrientation: boardOrientation,
            allowDragging: state === "playing",
            animationDurationInMs: 200,
            boardStyle: {
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
            darkSquareStyle: { backgroundColor: "#6aae47" },
            lightSquareStyle: { backgroundColor: "#ffffff" },
            squareStyles: customSquareStyles,
          }}
        />
      </div>

      {/* Hint text indicator */}
      {hintSquare && state === "playing" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-info-light border border-info rounded-lg text-sm">
          <LightBulbIcon className="h-4 w-4 text-info" />
          <span className="text-info-dark">
            Move the piece on <strong className="uppercase">{hintSquare}</strong>
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {state === "playing" && (
          <>
            <button
              onClick={showHint}
              disabled={!!hintSquare}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                hintSquare
                  ? "bg-info-light border border-info text-info-dark"
                  : "bg-warning-light border border-warning text-warning-dark hover:bg-warning-light"
              }`}
            >
              <LightBulbIcon className="h-4 w-4" />
              {hintSquare ? "Hint Active" : "Hint"}
            </button>
          </>
        )}
        {(state === "correct" || state === "incorrect") && (
          <>
            <button
              onClick={retry}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors text-sm font-medium"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Retry
            </button>
            {onNext && (
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <ForwardIcon className="h-4 w-4" />
                Next Puzzle
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PuzzleSolver;
