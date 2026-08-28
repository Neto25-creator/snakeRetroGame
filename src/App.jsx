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
  const [status, setStatus] = useState("idle"); // idle | playing | paused | over
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

  const togglePause = useCallback(() => {
    setStatus((current) => {
      if (current === "playing") return "paused";
      if (current === "paused") return "playing";
      return current;
    });
  }, []);

  const queueDirection = useCallback((dx, dy) => {
    // Se estiver pausado, ao pressionar uma direção podemos despausar e mudar a direção
    setStatus((current) => {
      if (current === "paused") return "playing";
      return current;
    });
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

      if (key === "p" || key === "pause" || key === "escape") {
        e.preventDefault();
        togglePause();
        return;
      }

      if (map[key]) {
        e.preventDefault();
        queueDirection(map[key][0], map[key][1]);
      } else if (key === " " || key === "enter") {
        e.preventDefault();
        if (status === "idle" || status === "over") {
          resetGame();
        } else if (status === "playing" || status === "paused") {
          togglePause();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, resetGame, queueDirection, togglePause]);

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
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 6px #ffbd2e; }
          50% { box-shadow: 0 0 16px #ffbd2e, 0 0 24px rgba(255,189,46,0.6); }
        }

        @media (prefers-reduced-motion: reduce) {
          .flicker { animation: none !important; }
        }

        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        .dpad-btn {
          transition: background 0.1s ease, transform 0.06s ease, box-shadow 0.1s ease;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
        }
        .dpad-btn:active {
          background: #1f7a1f !important;
          transform: scale(0.92);
          box-shadow: 0 0 10px #39ff14 inset !important;
        }
        .dpad-pause-btn:active {
          background: #5a4200 !important;
          transform: scale(0.92);
          box-shadow: 0 0 10px #ffbd2e inset !important;
        }

        .action-btn {
          transition: background 0.15s ease, color 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
          touch-action: manipulation;
          user-select: none;
        }
        .action-btn:hover {
          background: #39ff14 !important;
          color: #050705 !important;
          box-shadow: 0 0 12px rgba(57,255,20,0.6);
        }
        .action-btn:active {
          transform: scale(0.95);
        }

        .hud-pause-btn {
          background: #0f160f;
          border: 1px solid #1f3a1f;
          color: #39ff14;
          font-family: inherit;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 1px;
          transition: all 0.15s ease;
          touch-action: manipulation;
        }
        .hud-pause-btn:hover {
          border-color: #39ff14;
          box-shadow: 0 0 8px rgba(57,255,20,0.4);
        }
        .hud-pause-btn.is-paused {
          border-color: #ffbd2e;
          color: #ffbd2e;
          background: #1c1808;
          box-shadow: 0 0 8px rgba(255,189,46,0.5);
        }

        .action-btn:focus-visible, .dpad-btn:focus-visible, .hud-pause-btn:focus-visible {
          outline: 2px solid #39ff14;
          outline-offset: 2px;
        }

        /* Responsividade Mobile e Aumento dos Botões */
        @media (max-width: 600px) {
          .game-container {
            padding: 10px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .game-hud {
            font-size: 12px !important;
            margin-bottom: 8px !important;
          }
          .board-wrapper {
            max-width: 100% !important;
            display: flex;
            justify-content: center;
          }
          .controls-container {
            margin-top: 18px !important;
            max-width: 250px !important;
            gap: 10px !important;
          }
          .dpad-btn {
            height: 62px !important;
            font-size: 26px !important;
            border-radius: 8px !important;
          }
          .dpad-pause-btn {
            font-size: 20px !important;
            border-radius: 8px !important;
          }
          .hud-pause-btn {
            font-size: 12px !important;
            padding: 6px 12px !important;
          }
          .overlay-title {
            font-size: 24px !important;
          }
          .action-btn {
            padding: 12px 24px !important;
            font-size: 15px !important;
          }
        }

        @media (max-width: 380px) {
          .controls-container {
            max-width: 220px !important;
            gap: 8px !important;
          }
          .dpad-btn {
            height: 54px !important;
            font-size: 22px !important;
          }
        }
      `}</style>

      <div style={styles.frame} className="flicker game-container">
        {/* Barra de Título Superior */}
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

          {(status === "playing" || status === "paused") && (
            <button
              className={`hud-pause-btn ${status === "paused" ? "is-paused" : ""}`}
              onClick={togglePause}
              title={status === "paused" ? "Continuar jogo (P)" : "Pausar jogo (P)"}
              aria-label={status === "paused" ? "Continuar jogo" : "Pausar jogo"}
            >
              <span>{status === "paused" ? "▶" : "⏸"}</span>
              <span>{status === "paused" ? "RESUMIR" : "PAUSA"}</span>
            </button>
          )}
        </div>

        {/* HUD de Pontuação e Status */}
        <div style={styles.hud} className="game-hud">
          <span>SCORE: {String(score).padStart(3, "0")}</span>
          {status === "paused" && (
            <span style={styles.pausedBadge}>PAUSADO</span>
          )}
          <span style={{ color: "#ffb000" }}>
            HIGH: {String(highScore).padStart(3, "0")}
          </span>
        </div>

        {/* Tabuleiro do Jogo */}
        <div className="board-wrapper">
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

            {/* Overlays: Idle / Pausado / Game Over */}
            {status !== "playing" && (
              <div style={styles.overlay}>
                {status === "idle" && (
                  <>
                    <div style={styles.overlayTitle} className="overlay-title">SNAKE.SH</div>
                    <div style={styles.overlayText}>
                      setas / wasd / botões para mover
                      <br />
                      coma o ponto vermelho. não bata em si mesmo.
                      <br />
                      <span style={{ color: "#39ff14", display: "inline-block", marginTop: 4 }}>
                        [P] ou botão ⏸ para pausar
                      </span>
                    </div>
                    <button className="action-btn" style={styles.startBtn} onClick={resetGame}>
                      [ INICIAR ]
                    </button>
                  </>
                )}

                {status === "paused" && (
                  <>
                    <div
                      style={{ ...styles.overlayTitle, color: "#ffbd2e", textShadow: "0 0 12px #ffbd2e" }}
                      className="overlay-title"
                    >
                      JOGO PAUSADO
                    </div>
                    <div style={styles.overlayText}>
                      pontuação atual: <strong>{score}</strong>
                      <br />
                      pressione <strong>[P]</strong>, <strong>Espaço</strong> ou o botão abaixo para continuar
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                      <button
                        className="action-btn"
                        style={{ ...styles.startBtn, borderColor: "#ffbd2e", color: "#ffbd2e" }}
                        onClick={togglePause}
                      >
                        [ CONTINUAR ]
                      </button>
                      <button
                        className="action-btn"
                        style={{ ...styles.startBtn, borderColor: "#ff5f56", color: "#ff5f56" }}
                        onClick={resetGame}
                      >
                        [ REINICIAR ]
                      </button>
                    </div>
                  </>
                )}

                {status === "over" && (
                  <>
                    <div style={{ ...styles.overlayTitle, color: "#ff3b3b" }} className="overlay-title">
                      GAME OVER
                    </div>
                    <div style={styles.overlayText}>pontuação final: {score}</div>
                    <button className="action-btn" style={styles.startBtn} onClick={resetGame}>
                      [ JOGAR NOVAMENTE ]
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controles D-Pad com Botões Aumentados no Mobile e Botão de Pausa Central */}
        <div style={styles.controls} className="controls-container">
          <div />
          <button
            className="dpad-btn"
            style={styles.dpadBtn}
            onClick={() => queueDirection(0, -1)}
            aria-label="Cima"
          >
            ▲
          </button>
          <div />

          <button
            className="dpad-btn"
            style={styles.dpadBtn}
            onClick={() => queueDirection(-1, 0)}
            aria-label="Esquerda"
          >
            ◀
          </button>

          {/* Botão de Pausa / Play central integrado ao D-pad */}
          <button
            className="dpad-btn dpad-pause-btn"
            style={{
              ...styles.dpadBtn,
              background: status === "paused" ? "#2a2200" : "#121d12",
              borderColor: status === "paused" ? "#ffbd2e" : "#2a4a2a",
              color: status === "paused" ? "#ffbd2e" : "#39ff14",
              fontWeight: "bold",
            }}
            onClick={status === "idle" || status === "over" ? resetGame : togglePause}
            aria-label={
              status === "playing"
                ? "Pausar jogo"
                : status === "paused"
                ? "Continuar jogo"
                : "Iniciar jogo"
            }
            title={
              status === "playing"
                ? "Pausar (P)"
                : status === "paused"
                ? "Continuar (P)"
                : "Iniciar"
            }
          >
            {status === "playing" ? "⏸" : status === "paused" ? "▶" : "▶"}
          </button>

          <button
            className="dpad-btn"
            style={styles.dpadBtn}
            onClick={() => queueDirection(1, 0)}
            aria-label="Direita"
          >
            ▶
          </button>

          <div />
          <button
            className="dpad-btn"
            style={styles.dpadBtn}
            onClick={() => queueDirection(0, 1)}
            aria-label="Baixo"
          >
            ▼
          </button>
          <div />
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
    padding: "16px 12px",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    boxSizing: "border-box",
    width: "100%",
  },
  frame: {
    background: "#0c120c",
    border: "1px solid #1c2b1c",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 0 40px rgba(57,255,20,0.08), inset 0 0 60px rgba(0,0,0,0.5)",
    width: COLS * CELL + 32,
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  titleBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  dots: { display: "flex", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  titleText: {
    color: "#39ff14",
    fontSize: 13,
    letterSpacing: 1,
    textShadow: "0 0 6px #39ff14",
    flex: 1,
    textAlign: "left",
    marginLeft: 4,
  },
  hud: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#39ff14",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 10,
    textShadow: "0 0 4px #39ff14",
  },
  pausedBadge: {
    color: "#ffbd2e",
    fontWeight: "bold",
    letterSpacing: 2,
    fontSize: 12,
    background: "rgba(255, 189, 46, 0.15)",
    padding: "2px 8px",
    borderRadius: 4,
    border: "1px solid rgba(255, 189, 46, 0.4)",
    animation: "blink 1.2s ease infinite",
  },
  board: {
    position: "relative",
    backgroundColor: "#0a0f0a",
    backgroundImage:
      "repeating-linear-gradient(0deg, #16241a 0px, #16241a 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, #16241a 0px, #16241a 1px, transparent 1px, transparent 18px)",
    border: "1px solid #1f3a1f",
    overflow: "hidden",
    borderRadius: 6,
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
    backdropFilter: "blur(2px)",
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
    padding: "9px 18px",
    borderRadius: 6,
    cursor: "pointer",
    letterSpacing: 1,
  },
  controls: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    maxWidth: 190,
    marginLeft: "auto",
    marginRight: "auto",
  },
  dpadBtn: {
    background: "#0f160f",
    border: "1px solid #1f3a1f",
    color: "#39ff14",
    fontSize: 18,
    height: 46,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    cursor: "pointer",
  },
};