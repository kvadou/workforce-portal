"use client";

import { Chessboard } from "react-chessboard";

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface MiniBoardProps {
  fen?: string;
  size?: number;
  orientation?: "white" | "black";
  className?: string;
}

export function MiniBoard({
  fen = STARTING_FEN,
  size = 120,
  orientation = "white",
  className = "",
}: MiniBoardProps) {
  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: false,
          showAnimations: false,
          boardStyle: {
            borderRadius: "6px",
            overflow: "hidden",
          },
          darkSquareStyle: { backgroundColor: "#6aae47" },
          lightSquareStyle: { backgroundColor: "#ffffff" },
          showNotation: false,
        }}
      />
    </div>
  );
}

export default MiniBoard;
