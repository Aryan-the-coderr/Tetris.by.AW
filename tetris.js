document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('tetris-canvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Canvas context not available!');
    return;
  }
  const gridSize = 30;
  const cols = canvas.width / gridSize;
  const rows = canvas.height / gridSize;
  let board = Array(rows).fill().map(() => Array(cols).fill(0));
  let score = 0;
  let gameOver = false;
  let isPaused = false;
  let currentPiece = null;
  let lastTime = 0;
  let dropCounter = 0;
  let dropInterval = 1000;

  const pieces = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]] // Z
  ];
  const colors = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

  function createPiece() {
    const index = Math.floor(Math.random() * pieces.length);
    return { shape: pieces[index], color: colors[index], x: Math.floor(cols / 2) - 1, y: 0 };
  }

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (board[y][x]) {
          ctx.fillStyle = board[y][x];
          ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
          ctx.strokeStyle = '#fff'; // White outline
          ctx.strokeRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
        }
      }
    }
  }

  function drawPiece(piece) {
    ctx.fillStyle = piece.color;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          ctx.fillRect((piece.x + x) * gridSize, (piece.y + y) * gridSize, gridSize - 1, gridSize - 1);
          ctx.strokeStyle = '#fff'; // White outline
          ctx.strokeRect((piece.x + x) * gridSize, (piece.y + y) * gridSize, gridSize - 1, gridSize - 1);
        }
      }
    }
  }

  function collide(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          if (boardX < 0 || boardX >= cols || boardY >= rows || (boardY >= 0 && board[boardY][boardX])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function mergePiece(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          board[piece.y + y][piece.x + x] = piece.color;
        }
      }
    }
  }

  function clearLines() {
    let linesCleared = 0;
    for (let y = rows - 1; y >= 0; y--) {
      if (board[y].every(cell => cell !== 0)) {
        board.splice(y, 1);
        board.unshift(Array(cols).fill(0));
        linesCleared++;
        y++;
      }
    }
    score += linesCleared * 100;
    document.getElementById('score').textContent = `Score: ${score}`;
  }

  function rotatePiece(piece) {
    const newShape = Array(piece.shape[0].length).fill().map(() => Array(piece.shape.length).fill(0));
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        newShape[x][piece.shape.length - 1 - y] = piece.shape[y][x];
      }
    }
    const newPiece = { ...piece, shape: newShape };
    if (!collide(newPiece)) {
      piece.shape = newShape;
    }
  }

  function movePiece(dx, dy) {
    const newPiece = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy };
    if (!collide(newPiece)) {
      currentPiece.x = newPiece.x;
      currentPiece.y = newPiece.y;
      return true;
    }
    return false;
  }

  function dropPiece() {
    if (!movePiece(0, 1)) {
      mergePiece(currentPiece);
      clearLines();
      currentPiece = createPiece();
      if (collide(currentPiece)) {
        gameOver = true;
        document.getElementById('game-over').style.display = 'block';
      }
    }
  }

  function gameLoop(time = 0) {
    if (!isPaused && !gameOver) {
      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;
      if (dropCounter > dropInterval) {
        dropPiece();
        dropCounter = 0;
      }
      drawBoard();
      drawPiece(currentPiece);
    }
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    board = Array(rows).fill().map(() => Array(cols).fill(0));
    score = 0;
    gameOver = false;
    isPaused = false;
    currentPiece = createPiece();
    dropCounter = 0;
    lastTime = 0;
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('game-over').style.display = 'none';
    gameLoop();
  }

  // Touch controls
  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;
    if (Math.abs(deltaX) > 50) {
      movePiece(deltaX > 0 ? 1 : -1, 0);
      touchStartX = touchX;
    }
    if (deltaY > 50) {
      dropPiece();
      touchStartY = touchY;
    }
  });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    rotatePiece(currentPiece);
  });

  // Button controls
  document.getElementById('left-btn').addEventListener('click', () => movePiece(-1, 0));
  document.getElementById('right-btn').addEventListener('click', () => movePiece(1, 0));
  document.getElementById('rotate-btn').addEventListener('click', () => rotatePiece(currentPiece));
  document.getElementById('down-btn').addEventListener('click', () => dropPiece());
  document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
  });
  document.getElementById('restart-btn').addEventListener('click', startGame);

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (gameOver || isPaused) return;
    if (e.key === 'ArrowLeft') movePiece(-1, 0);
    if (e.key === 'ArrowRight') movePiece(1, 0);
    if (e.key === 'ArrowUp') rotatePiece(currentPiece);
    if (e.key === 'ArrowDown') dropPiece();
  });

  startGame();
});