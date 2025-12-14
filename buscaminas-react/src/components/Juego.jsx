import { useEffect, useRef, useState } from "react";

function createBoard(rawSize, rawMines) {
  const size = Number(rawSize);
  const maxCells = size * size;
  const mines = Math.min(Number(rawMines), maxCells - 1);
  if (!size || size < 2) return [];

  const board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacent: 0,
    }))
  );

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      placed++;
    }
  }

  const dirs = [-1, 0, 1];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      dirs.forEach(dr => {
        dirs.forEach(dc => {
          if (dr === 0 && dc === 0) return;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (board[nr][nc].isMine) count++;
          }
        });
      });
      board[r][c].adjacent = count;
    }
  }

  return board;
}

export default function Buscaminas() {
  const [size, setSize] = useState(8);
  const [mines, setMines] = useState(10);
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Temporizador
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const [started, setStarted] = useState(false);

  // Ranking
  const [ranking, setRanking] = useState(() => {
    return JSON.parse(localStorage.getItem("ranking")) || [];
  });

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startGame = () => {
    setBoard(createBoard(size, mines));
    setGameOver(false);
    setWon(false);
    setTime(0);
    setStarted(false);
    stopTimer();
  };

  useEffect(() => {
    startGame();
  }, [size, mines]);

  const revealCell = (r, c, newBoard) => {
    const cell = newBoard[r]?.[c];
    if (!cell || cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;

    if (cell.adjacent === 0 && !cell.isMine) {
      [-1, 0, 1].forEach(dr => {
        [-1, 0, 1].forEach(dc => {
          if (dr === 0 && dc === 0) return;
          revealCell(r + dr, c + dc, newBoard);
        });
      });
    }
  };

  const checkWin = newBoard => {
    for (let row of newBoard) {
      for (let cell of row) {
        if (!cell.isMine && !cell.isRevealed) return false;
      }
    }
    return true;
  };

  const handleClick = (r, c) => {
    if (gameOver || won) return;

    if (!started) {
      startTimer();
      setStarted(true);
    }

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const cell = newBoard[r][c];

    if (cell.isMine) {
      newBoard.forEach(row =>
        row.forEach(cell => {
          if (cell.isMine) cell.isRevealed = true;
        })
      );
      stopTimer();
      setGameOver(true);
      setBoard(newBoard);
      alert("💥 Game Over");
      return;
    }

    revealCell(r, c, newBoard);

    if (checkWin(newBoard)) {
      stopTimer();
      setWon(true);
      const name = prompt("¡Has ganado! Introduce tu nombre:");
      if (name) {
        const newRanking = [...ranking, { name, time }]
          .sort((a, b) => a.time - b.time)
          .slice(0, 10);
        setRanking(newRanking);
        localStorage.setItem("ranking", JSON.stringify(newRanking));
      }
    }

    setBoard(newBoard);
  };

  const handleFlag = (r, c) => {
    if (gameOver || won) return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const cell = newBoard[r][c];
    if (!cell.isRevealed) cell.isFlagged = !cell.isFlagged;
    setBoard(newBoard);
  }

  const handleRightClick = (e, r, c) => {
    e.preventDefault();
    handleFlag(r, c);
  };

  const longPressTimeout = useRef(null);

  const handleTouchStart = (r, c) => {
    longPressTimeout.current = setTimeout(() => {
      handleFlag(r, c);
    }, 500);
  };

  const handleTouchEnd = (r, c) => {
    clearTimeout(longPressTimeout.current);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">

      <h1 className="text-3xl font-bold mb-4">Buscaminas - ⏱️ {time}s</h1>
      <div className="flex flex-col gap-4 mb-4 w-full max-w-md items-center">
            <label className="block">Casillas: {size}
            <input
                type="range"
                value={size}
                step={2}
                onChange={e => setSize(Number(e.target.value))}
                className="text-white ml-5 w-50"
                min={4}
                max={16}
            />
            </label>
    
            <label className="block mb-2">Minas: {mines}
            <input
                type="range"
                value={mines}
                onChange={e => setMines(Number(e.target.value))}
                className="text-white ml-5 w-50"
                min={1}
                max={25}
            />
            </label>
        <button
          onClick={startGame}
          className="bg-blue-600 px-4 py-1 rounded"
        >
          Reiniciar
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${size}, 2.5rem)` }}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => handleClick(r, c)}
              onContextMenu={e => handleRightClick(e, r, c)}
              onTouchStart={() => handleTouchStart(r, c)}
              onTouchEnd={() => handleTouchEnd(r, c)}
              className={`w-10 h-10 border border-gray-700 flex items-center justify-center cursor-pointer
                ${cell.isRevealed ? "bg-gray-700" : "bg-gray-500 hover:bg-gray-400"}`}
            >
              {cell.isRevealed && cell.isMine && "💣"}
              {cell.isRevealed && !cell.isMine && cell.adjacent > 0 && cell.adjacent}
              {!cell.isRevealed && cell.isFlagged && "🚩"}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 w-full max-w-md bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-bold mb-2">🏆 Ranking (Top 10)</h2>
        <ol className="list-decimal list-inside">
          {ranking.map((r, i) => (
            <li key={i}>{r.name} - {r.time}s</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
