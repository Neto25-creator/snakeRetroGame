import { useState, useEffect, useRef, useCallback } from "react";

const COLS = 20;
const ROWS = 20;
const CELL = 18;
const BASE_SPEED = 150;
const MIN_SPEED = 65;
const SPEED_STEP = 4;

const initialSnake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

function randCell() {
  return {
    x: Math.floor(Math.random() * COLS),
    y: Math.floor(Math.random() * ROWS),
  };
}

function spawnFood(snake) {
  let pos;
  do {
    pos = randCell();
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame() {
  const [snake, setSnake] = useState(initialSnake);
  const [food, setFood] = useState(() => spawnFood(initialSnake));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | playing | over
  const [speed, setSpeed] = useState(BASE_SPEED);

  const snakeRef = useRef(initialSnake);
  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });

  const resetGame = useCallback(() => {
    const fresh = initialSnake.map((s) => ({ ...s }));
    snakeRef.current = fresh;
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    setSnake(fresh);
    setFood(spawnFood(fresh));
    setScore(0);
    setSpeed(BASE_SPEED);
    setStatus("playing");
  }, []);

  const queueDirection = useCallback((dx, dy) => {
    const cur = directionRef.current;
    if (cur.x === -dx && cur.y === -dy) return;
    nextDirectionRef.current = { x: dx, y: dy };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      const key = e.key.toLowerCase();
      const map = {
        arrowup: [0, -1],
        w: [0, -1],
        arrowdown: [0, 1],
        s: [0, 1],
        arrowleft: [-1, 0],
        a: [-1, 0],
        arrowright: [1, 0],
        d: [1, 0],
      };
      if (map[key]) {
        e.preventDefault();
        queueDirection(map[key][0], map[key][1]);
      } else if (key === " " || key === "enter") {
        e.preventDefault();
        setStatus((s) => (s === "playing" ? s : "playing"));
        if (status !== "playing") resetGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, resetGame, queueDirection]);

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      directionRef.current = nextDirectionRef.current;
      const prevSnake = snakeRef.current;
      const head = prevSnake[0];
      const dir = directionRef.current;
      const newHead = { x: head.x + dir.x, y: head.y + dir.y };

      const hitWall =
        newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
      const hitSelf = prevSnake.some((s) => s.x === newHead.x && s.y === newHead.y);

      if (hitWall || hitSelf) {
        setStatus("over");
        return;
      }

      const ateFood = newHead.x === food.x && newHead.y === food.y;
      const newSnake = [newHead, ...prevSnake];
      if (!ateFood) newSnake.pop();
      snakeRef.current = newSnake;
      setSnake(newSnake);

      if (ateFood) {
        const newScore = score + 1;
        setScore(newScore);
        setHighScore((hs) => Math.max(hs, newScore));
        setFood(spawnFood(newSnake));
        setSpeed((sp) => Math.max(MIN_SPEED, sp - SPEED_STEP));
      }
    }, speed);
    return () => clearInterval(id);
  }, [status, speed, food, score]);

  return (
    <div style={styles.outer}>
      <style>{`
        @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        @keyframes flicker { 0%, 100% { opacity: 0.97; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .flicker { animation: none !important; }
        }
        .dpad-btn { transition: background 0.1s ease, transform 0.05s ease; }
        .dpad-btn:active { background: #1f7a1f !important; transform: scale(0.94); }
        .action-btn:hover { background: #39ff14 !important; color: #050705 !important; }
        .action-btn:focus-visible, .dpad-btn:focus-visible {
          outline: 2px solid #39ff14; outline-offset: 2px;
        }
      `}</style>
      <div style={styles.frame} className="flicker">
        <div style={styles.titleBar}>
          <div style={styles.dots}>
            <span style={{ ...styles.dot, background: "#ff5f56" }} />
            <span style={{ ...styles.dot, background: "#ffbd2e" }} />
            <span style={{ ...styles.dot, background: "#27c93f" }} />
          </div>
          <div style={styles.titleText}>
            snake.sh
            <span style={{ animation: "blink 1s step-start infinite" }}>_</span>
          </div>
        </div>

        <div style={styles.hud}>
          <span>SCORE: {String(score).padStart(3, "0")}</span>
          <span style={{ color: "#ffb000" }}>
            HIGH: {String(highScore).padStart(3, "0")}
          </span>
        </div>

        <div style={{ ...styles.board, width: COLS * CELL, height: ROWS * CELL }}>
          {snake.map((seg, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: seg.x * CELL,
                top: seg.y * CELL,
                width: CELL - 2,
                height: CELL - 2,
                background: i === 0 ? "#8dffb0" : "#39ff14",
                boxShadow:
                  i === 0
                    ? "0 0 6px #8dffb0, 0 0 10px #39ff14"
                    : "0 0 4px #39ff14",
                borderRadius: 3,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: food.x * CELL,
              top: food.y * CELL,
              width: CELL - 2,
              height: CELL - 2,
              background: "#ff3b3b",
              boxShadow: "0 0 8px #ff3b3b",
              borderRadius: "50%",
            }}
          />

          {status !== "playing" && (
            <div style={styles.overlay}>
              {status === "idle" ? (
                <>
                  <div style={styles.overlayTitle}>SNAKE.SH</div>
                  <div style={styles.overlayText}>
                    arrows / wasd to move
                    <br />
                    eat the red dot. don't hit yourself.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ ...styles.overlayTitle, color: "#ff3b3b" }}>
                    GAME OVER
                  </div>
                  <div style={styles.overlayText}>final score: {score}</div>
                </>
              )}
              <button className="action-btn" style={styles.startBtn} onClick={resetGame}>
                {status === "idle" ? "[ START ]" : "[ RETRY ]"}
              </button>
            </div>
          )}
        </div>

        <div style={styles.controls}>
          <div />
          <button className="dpad-btn" style={styles.dpadBtn} onClick={() => queueDirection(0, -1)} aria-label="Up">▲</button>
          <div />
          <button className="dpad-btn" style={styles.dpadBtn} onClick={() => queueDirection(-1, 0)} aria-label="Left">◀</button>
          <button className="dpad-btn" style={styles.dpadBtn} onClick={() => queueDirection(0, 1)} aria-label="Down">▼</button>
          <button className="dpad-btn" style={styles.dpadBtn} onClick={() => queueDirection(1, 0)} aria-label="Right">▶</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  outer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050705",
    padding: 20,
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    boxSizing: "border-box",
  },
  frame: {
    background: "#0c120c",
    border: "1px solid #1c2b1c",
    borderRadius: 10,
    padding: 16,
    boxShadow: "0 0 40px rgba(57,255,20,0.08), inset 0 0 60px rgba(0,0,0,0.5)",
    width: COLS * CELL + 32,
    boxSizing: "border-box",
  },
  titleBar: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  dots: { display: "flex", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  titleText: {
    color: "#39ff14",
    fontSize: 13,
    letterSpacing: 1,
    textShadow: "0 0 6px #39ff14",
  },
  hud: {
    display: "flex",
    justifyContent: "space-between",
    color: "#39ff14",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 8,
    textShadow: "0 0 4px #39ff14",
  },
  board: {
    position: "relative",
    backgroundColor: "#0a0f0a",
    backgroundImage:
      "repeating-linear-gradient(0deg, #16241a 0px, #16241a 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, #16241a 0px, #16241a 1px, transparent 1px, transparent 18px)",
    border: "1px solid #1f3a1f",
    overflow: "hidden",
    borderRadius: 4,
    boxSizing: "border-box",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(5,7,5,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    textAlign: "center",
    padding: 20,
  },
  overlayTitle: {
    color: "#39ff14",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 2,
    textShadow: "0 0 8px currentColor",
  },
  overlayText: { color: "#7fbf7f", fontSize: 12, lineHeight: 1.6 },
  startBtn: {
    background: "transparent",
    border: "1px solid #39ff14",
    color: "#39ff14",
    fontFamily: "inherit",
    fontSize: 13,
    padding: "8px 16px",
    borderRadius: 4,
    cursor: "pointer",
    letterSpacing: 1,
  },
  controls: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 6,
    maxWidth: 160,
    marginLeft: "auto",
    marginRight: "auto",
  },
  dpadBtn: {
    background: "#0f160f",
    border: "1px solid #1f3a1f",
    color: "#39ff14",
    fontSize: 16,
    padding: "8px 0",
    borderRadius: 4,
    cursor: "pointer",
  },
};