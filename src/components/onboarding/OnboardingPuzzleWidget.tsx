"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Chess, Square } from "chess.js";
import dynamic from "next/dynamic";
import {
  LightBulbIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  TrophyIcon,
  XMarkIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Dynamically import Chessboard to avoid SSR issues
const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  { ssr: false }
);

interface PuzzleData {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
  hint?: string;
}

type PuzzleState = "loading" | "playing" | "correct" | "incorrect" | "complete";

function uciToMove(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

// Theme descriptions for better hints
const THEME_HINTS: Record<string, string> = {
  mateIn1: "Find checkmate in 1 move!",
  mateIn2: "Find checkmate in 2 moves!",
  fork: "Attack two pieces at once!",
  pin: "Pin a piece to the king!",
  skewer: "Attack through one piece to another!",
  discoveredAttack: "Move a piece to reveal an attack!",
  backRankMate: "Checkmate on the back rank!",
  smotheredMate: "Checkmate with a knight!",
  hangingPiece: "Capture the undefended piece!",
  sacrifice: "Give up material for a bigger gain!",
  default: "Find the best move!",
};

// 9 puzzles organized by difficulty (rating ranges)
const ALL_PUZZLES: PuzzleData[] = [
  // Easy (400-600) - Simple captures and mate in 1
  {
    id: "easy-1",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1",
    moves: "g8h8 a1a8",
    rating: 400,
    themes: ["backRankMate", "mateIn1"],
    hint: "The rook can reach the 8th rank...",
  },
  {
    id: "easy-2",
    fen: "6k1/5ppp/8/8/8/8/5PPP/3Q2K1 b - - 0 1",
    moves: "g8h8 d1d8",
    rating: 450,
    themes: ["backRankMate", "mateIn1"],
    hint: "The queen controls the entire file...",
  },
  {
    id: "easy-3",
    fen: "5r1k/6pp/8/4N3/8/8/6PP/6K1 b - - 0 1",
    moves: "f8g8 e5f7",
    rating: 500,
    themes: ["smotheredMate", "mateIn1"],
    hint: "The knight can deliver a special checkmate...",
  },
  {
    id: "easy-4",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3",
    moves: "f3g5",
    rating: 550,
    themes: ["fork"],
    hint: "The knight can threaten multiple pieces...",
  },
  // Medium (600-800)
  {
    id: "med-1",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    moves: "f3g5",
    rating: 650,
    themes: ["fork"],
    hint: "Attack the weak f7 square!",
  },
  {
    id: "med-2",
    fen: "r2qkb1r/ppp2ppp/2n1bn2/3pp3/4P3/1PN2N2/PBPP1PPP/R2QKB1R w KQkq - 4 5",
    moves: "e4d5 e6d5 f3e5",
    rating: 700,
    themes: ["fork"],
    hint: "Clear the center, then strike!",
  },
  {
    id: "med-3",
    fen: "r1bqk2r/ppppbppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    moves: "f3g5 d7d5 g5f7",
    rating: 750,
    themes: ["fork", "mateIn2"],
    hint: "Threaten f7, then capture with check!",
  },
  // Hard (800+)
  {
    id: "hard-1",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    moves: "f3g5 d7d5 g5f7 e8e7 c4d5",
    rating: 850,
    themes: ["fork", "discoveredAttack"],
    hint: "Multiple tactics in sequence!",
  },
  {
    id: "hard-2",
    fen: "r2q1rk1/ppp2ppp/2n1bn2/3p4/3P4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 9",
    moves: "d3h7 g8h7 d1h5 h7g8 h5f7",
    rating: 900,
    themes: ["mateIn2", "sacrifice"],
    hint: "Sacrifice to expose the king!",
  },
];

// Storage key for progress
const STORAGE_KEY = "onboarding-chess-puzzle-progress";

interface PuzzleProgress {
  completedIds: string[];
  currentRating: number;
  totalSolved: number;
  totalAttempted: number;
  currentStreak: number;
  bestStreak: number;
  dismissed: boolean;
}

function getProgress(): PuzzleProgress {
  if (typeof window === "undefined") {
    return { completedIds: [], currentRating: 400, totalSolved: 0, totalAttempted: 0, currentStreak: 0, bestStreak: 0, dismissed: false };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { completedIds: [], currentRating: 400, totalSolved: 0, totalAttempted: 0, currentStreak: 0, bestStreak: 0, dismissed: false };
}

function saveProgress(progress: PuzzleProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

// Record attempt to API
async function recordAttempt(data: {
  puzzleId: string;
  rating: number;
  solved: boolean;
  usedHint: boolean;
  moveCount: number;
  timeMs: number;
  currentStreak: number;
}) {
  try {
    await fetch("/api/onboarding/puzzle-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Failed to record puzzle attempt:", err);
  }
}

export function OnboardingPuzzleWidget({ className = "" }: { className?: string }) {
  const [game, setGame] = useState<Chess | null>(null);
  const [state, setState] = useState<PuzzleState>("loading");
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [showHint, setShowHint] = useState(false);
  const [usedHintThisPuzzle, setUsedHintThisPuzzle] = useState(false);
  const [progress, setProgress] = useState<PuzzleProgress>(getProgress);
  const moveListRef = useRef<string[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const moveCountRef = useRef<number>(0);

  // Get next puzzle based on progress
  const getNextPuzzle = useCallback((currentProgress: PuzzleProgress) => {
    const availablePuzzles = ALL_PUZZLES
      .filter((p) => !currentProgress.completedIds.includes(p.id))
      .filter((p) => p.rating <= currentProgress.currentRating + 200) // Don't jump too far ahead
      .sort((a, b) => a.rating - b.rating);

    if (availablePuzzles.length === 0) {
      // All puzzles completed at this level, unlock harder ones or reset
      if (currentProgress.currentRating < 1000) {
        const newProgress = { ...currentProgress, currentRating: currentProgress.currentRating + 100 };
        setProgress(newProgress);
        saveProgress(newProgress);
        return ALL_PUZZLES.find((p) => p.rating <= newProgress.currentRating + 200);
      }
      // All puzzles done
      return null;
    }

    return availablePuzzles[0];
  }, []);

  // Initialize first puzzle
  useEffect(() => {
    const savedProgress = getProgress();
    setProgress(savedProgress);

    if (savedProgress.dismissed) {
      setState("complete");
      return;
    }

    const puzzle = getNextPuzzle(savedProgress);
    if (puzzle) {
      setCurrentPuzzle(puzzle);
    } else {
      setState("complete");
    }
  }, [getNextPuzzle]);

  // Setup board when puzzle changes
  useEffect(() => {
    if (!currentPuzzle) return;

    const chess = new Chess(currentPuzzle.fen);
    const moves = currentPuzzle.moves.split(" ").filter(Boolean);
    moveListRef.current = moves;

    // Determine player color from whose turn it is
    setBoardOrientation(chess.turn() === "w" ? "white" : "black");
    setGame(chess);
    setMoveIndex(0);
    setSquareStyles({});
    setShowHint(false);
    setUsedHintThisPuzzle(false);
    startTimeRef.current = Date.now();
    moveCountRef.current = 0;
    setState("playing");
  }, [currentPuzzle]);

  // Declare handlePuzzleSolved before handlePieceDrop since it's called from there
  const handlePuzzleSolved = useCallback(() => {
    if (!currentPuzzle) return;

    setState("correct");
    const timeMs = Date.now() - startTimeRef.current;
    const newStreak = progress.currentStreak + 1;

    const newProgress: PuzzleProgress = {
      completedIds: [...progress.completedIds, currentPuzzle.id],
      currentRating: Math.max(progress.currentRating, currentPuzzle.rating),
      totalSolved: progress.totalSolved + 1,
      totalAttempted: progress.totalAttempted + 1,
      currentStreak: newStreak,
      bestStreak: Math.max(progress.bestStreak, newStreak),
      dismissed: false,
    };
    setProgress(newProgress);
    saveProgress(newProgress);

    // Record to API
    recordAttempt({
      puzzleId: currentPuzzle.id,
      rating: currentPuzzle.rating,
      solved: true,
      usedHint: usedHintThisPuzzle,
      moveCount: moveCountRef.current,
      timeMs,
      currentStreak: newStreak,
    });
  }, [currentPuzzle, progress, usedHintThisPuzzle]);

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare, piece }: { sourceSquare: string; targetSquare: string | null; piece: { pieceType: string } }) => {
      if (state !== "playing" && state !== "incorrect") return false;
      if (!game || !targetSquare) return false;

      const moves = moveListRef.current;
      const expected = moves[moveIndex];
      if (!expected) return false;

      const expectedMove = uciToMove(expected);
      const pieceStr = piece.pieceType;
      const isPromotion =
        pieceStr[1] === "P" &&
        ((pieceStr[0] === "w" && targetSquare[1] === "8") ||
          (pieceStr[0] === "b" && targetSquare[1] === "1"));
      const promotion = isPromotion ? expectedMove.promotion || "q" : undefined;

      const isCorrect = sourceSquare === expectedMove.from && targetSquare === expectedMove.to;

      moveCountRef.current++;

      if (isCorrect) {
        const newGame = new Chess(game.fen());
        try {
          newGame.move({
            from: sourceSquare as Square,
            to: targetSquare as Square,
            promotion: promotion as "q" | "r" | "b" | "n" | undefined,
          });
        } catch {
          return false;
        }

        setGame(newGame);
        setSquareStyles({
          [sourceSquare]: { backgroundColor: "rgba(34, 197, 94, 0.3)" },
          [targetSquare]: { backgroundColor: "rgba(34, 197, 94, 0.5)" },
        });

        const nextMoveIdx = moveIndex + 1;

        // Check if puzzle is complete
        if (nextMoveIdx >= moves.length) {
          // Puzzle solved!
          handlePuzzleSolved();
          return true;
        }

        // Play opponent's response
        setMoveIndex(nextMoveIdx);
        setTimeout(() => {
          const oppMove = uciToMove(moves[nextMoveIdx]);
          const afterOpp = new Chess(newGame.fen());
          try {
            afterOpp.move({
              from: oppMove.from as Square,
              to: oppMove.to as Square,
              promotion: oppMove.promotion as "q" | "r" | "b" | "n" | undefined,
            });
            setGame(afterOpp);
            setMoveIndex(nextMoveIdx + 1);

            // Highlight opponent's move briefly
            setSquareStyles({
              [oppMove.from]: { backgroundColor: "rgba(239, 68, 68, 0.2)" },
              [oppMove.to]: { backgroundColor: "rgba(239, 68, 68, 0.3)" },
            });
            setTimeout(() => setSquareStyles({}), 500);

            // Check if there are more moves for player
            if (nextMoveIdx + 1 >= moves.length) {
              handlePuzzleSolved();
            }
          } catch {}
        }, 400);
        return true;
      } else {
        // Wrong move
        setSquareStyles({
          [targetSquare]: { backgroundColor: "rgba(239, 68, 68, 0.5)" },
        });
        setTimeout(() => setSquareStyles({}), 600);
        setState("incorrect");
        return false;
      }
    },
    [state, game, moveIndex, handlePuzzleSolved]
  );

  const handlePuzzleFailed = useCallback(() => {
    if (!currentPuzzle) return;

    const timeMs = Date.now() - startTimeRef.current;

    const newProgress: PuzzleProgress = {
      ...progress,
      totalAttempted: progress.totalAttempted + 1,
      currentStreak: 0, // Reset streak on failure
    };
    setProgress(newProgress);
    saveProgress(newProgress);

    // Record to API
    recordAttempt({
      puzzleId: currentPuzzle.id,
      rating: currentPuzzle.rating,
      solved: false,
      usedHint: usedHintThisPuzzle,
      moveCount: moveCountRef.current,
      timeMs,
      currentStreak: 0,
    });
  }, [currentPuzzle, progress, usedHintThisPuzzle]);

  const nextPuzzle = useCallback(() => {
    const puzzle = getNextPuzzle(progress);
    if (puzzle) {
      setCurrentPuzzle(puzzle);
    } else {
      setState("complete");
    }
  }, [getNextPuzzle, progress]);

  const retryPuzzle = useCallback(() => {
    if (!currentPuzzle) return;
    handlePuzzleFailed(); // Record the failure
    const chess = new Chess(currentPuzzle.fen);
    setGame(chess);
    setMoveIndex(0);
    setSquareStyles({});
    setShowHint(false);
    startTimeRef.current = Date.now();
    moveCountRef.current = 0;
    setState("playing");
  }, [currentPuzzle, handlePuzzleFailed]);

  const handleShowHint = useCallback(() => {
    if (state !== "playing" && state !== "incorrect") return;
    const moves = moveListRef.current;
    const expected = moves[moveIndex];
    if (!expected) return;
    const expectedMove = uciToMove(expected);

    // Highlight source square
    setSquareStyles({
      [expectedMove.from]: {
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        boxShadow: "inset 0 0 12px rgba(59, 130, 246, 0.9)",
      },
    });
    setShowHint(true);
    setUsedHintThisPuzzle(true);

    // Clear after 3 seconds
    setTimeout(() => {
      setSquareStyles({});
    }, 3000);
  }, [state, moveIndex]);

  const handleDismiss = useCallback(() => {
    const newProgress = { ...progress, dismissed: true };
    setProgress(newProgress);
    saveProgress(newProgress);
    setState("complete");
  }, [progress]);

  const handleReset = useCallback(() => {
    const newProgress: PuzzleProgress = {
      completedIds: [],
      currentRating: 400,
      totalSolved: 0,
      totalAttempted: 0,
      currentStreak: 0,
      bestStreak: progress.bestStreak, // Keep best streak
      dismissed: false,
    };
    setProgress(newProgress);
    saveProgress(newProgress);
    setCurrentPuzzle(ALL_PUZZLES[0]);
  }, [progress.bestStreak]);

  const getThemeHint = () => {
    if (!currentPuzzle) return THEME_HINTS.default;
    if (currentPuzzle.hint) return currentPuzzle.hint;
    const theme = currentPuzzle.themes[0];
    return THEME_HINTS[theme] || THEME_HINTS.default;
  };

  // Dismissed state - show nothing
  if (progress.dismissed && state !== "complete") return null;

  // Loading state
  if (state === "loading" || !currentPuzzle) {
    return (
      <div className={`bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <PuzzlePieceIcon className="h-5 w-5 text-white" />
            <span className="font-bold text-white">Chess Puzzle</span>
          </div>
        </div>
        <div className="p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Complete state
  if (state === "complete" || progress.completedIds.length >= ALL_PUZZLES.length) {
    return (
      <div className={`bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-success to-info px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-white" />
            <span className="font-bold text-white">Puzzles Complete!</span>
          </div>
          <button onClick={handleDismiss} className="text-white/60 hover:text-white">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 text-center">
          <div className="h-14 w-14 rounded-lg bg-success-light flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🏆</span>
          </div>
          <h4 className="font-bold text-neutral-900 mb-1">Great job!</h4>
          <p className="text-sm text-neutral-600 mb-1">
            You solved {progress.totalSolved} of {ALL_PUZZLES.length} puzzles!
          </p>
          {progress.bestStreak > 1 && (
            <p className="text-xs text-warning mb-3">Best streak: 🔥 {progress.bestStreak}</p>
          )}
          <button
            onClick={handleReset}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Play again?
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PuzzlePieceIcon className="h-5 w-5 text-white" />
            <div>
              <h3 className="font-bold text-white text-sm">Chess Puzzle</h3>
              <p className="text-[11px] text-white/70">
                {progress.totalSolved > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-success-light">{progress.totalSolved} solved</span>
                    <span className="text-white/40">·</span>
                    <span>{progress.totalAttempted} tried</span>
                    {progress.currentStreak > 1 && (
                      <>
                        <span className="text-white/40">·</span>
                        <span className="text-warning-light">🔥 {progress.currentStreak}</span>
                      </>
                    )}
                  </span>
                ) : (
                  "Test your chess skills!"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-3">
        {/* Status Message */}
        <div className="mb-3">
          {(state === "playing" || state === "incorrect") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 border border-primary-100 rounded-lg">
                <div
                  className={`h-3 w-3 rounded ${
                    boardOrientation === "white" ? "bg-white border border-neutral-300" : "bg-neutral-800"
                  }`}
                />
                <span className="text-primary-700 font-medium text-xs">
                  {showHint ? getThemeHint() : `${boardOrientation === "white" ? "White" : "Black"} to move`}
                </span>
              </div>
              {showHint && (
                <p className="text-center text-[10px] text-info">
                  The highlighted square shows which piece to move
                </p>
              )}
              {state === "incorrect" && (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-error-light border border-error rounded-lg">
                  <span className="text-error text-sm">✗</span>
                  <span className="text-error font-medium text-xs">Not quite — try again!</span>
                </div>
              )}
            </div>
          )}
          {state === "correct" && (
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-success-light border border-success rounded-lg">
              <span className="text-success text-sm">✓</span>
              <span className="text-success-dark font-medium text-xs">Correct! Well done.</span>
            </div>
          )}
        </div>

        {/* Chessboard */}
        <div className="max-w-[260px] mx-auto">
          {game && (
            <Chessboard
              options={{
                position: game.fen(),
                onPieceDrop: handlePieceDrop as (move: { sourceSquare: string; targetSquare: string | null; piece: { pieceType: string } }) => boolean,
                boardOrientation: boardOrientation,
                allowDragging: state === "playing" || state === "incorrect",
                animationDurationInMs: 200,
                boardStyle: {
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                },
                darkSquareStyle: { backgroundColor: "#6aae47" },
                lightSquareStyle: { backgroundColor: "#ffffff" },
                squareStyles: squareStyles,
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {(state === "playing" || state === "incorrect") && (
            <button
              onClick={handleShowHint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-info bg-info-light rounded-lg hover:bg-info-light transition-colors border border-info"
            >
              <LightBulbIcon className="h-3.5 w-3.5" />
              Hint
            </button>
          )}
          {state === "incorrect" && (
            <button
              onClick={retryPuzzle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
          {state === "correct" && (
            <button
              onClick={nextPuzzle}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:opacity-90 transition-opacity"
            >
              Next Puzzle
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-2.5 text-[10px] text-neutral-400">
          Difficulty: {currentPuzzle.rating} · {progress.completedIds.length}/{ALL_PUZZLES.length} complete
        </div>
      </div>
    </div>
  );
}
