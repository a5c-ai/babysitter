// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let vsAI = false;
let scores = {
    X: 0,
    O: 0,
    draw: 0
};

// Winning combinations
const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// DOM elements
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const modeBtn = document.getElementById('modeBtn');
const scoreXDisplay = document.getElementById('scoreX');
const scoreODisplay = document.getElementById('scoreO');
const scoreDrawDisplay = document.getElementById('scoreDraw');

// Initialize game
function init() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    resetBtn.addEventListener('click', resetGame);
    modeBtn.addEventListener('click', toggleMode);
    loadScores();
    updateScoreDisplay();
}

// Handle cell click
function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (board[index] !== '' || !gameActive) {
        return;
    }

    makeMove(index, currentPlayer);

    if (gameActive && vsAI && currentPlayer === 'O') {
        // AI move with slight delay for better UX
        setTimeout(() => {
            if (gameActive) {
                aiMove();
            }
        }, 500);
    }
}

// Make a move
function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    cell.disabled = true;

    checkResult();

    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateStatus();
    }
}

// AI move using minimax algorithm
function aiMove() {
    const bestMove = getBestMove();
    makeMove(bestMove, 'O');
}

// Minimax algorithm for AI
function minimax(newBoard, player) {
    const availSpots = newBoard.reduce((acc, cell, idx) => {
        if (cell === '') acc.push(idx);
        return acc;
    }, []);

    const winner = checkWinner(newBoard);
    if (winner === 'O') return { score: 10 };
    if (winner === 'X') return { score: -10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves = [];

    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

// Get best move for AI
function getBestMove() {
    const boardCopy = [...board];
    const move = minimax(boardCopy, 'O');
    return move.index;
}

// Check for winner
function checkWinner(boardState) {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            return boardState[a];
        }
    }
    return null;
}

// Check game result
function checkResult() {
    let roundWon = false;
    let winningPattern = null;

    for (let i = 0; i < winPatterns.length; i++) {
        const pattern = winPatterns[i];
        const [a, b, c] = pattern;

        if (board[a] === '') continue;
        if (board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningPattern = pattern;
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        statusDisplay.textContent = `Player ${currentPlayer} Wins!`;
        statusDisplay.classList.add('winner');
        highlightWinningCells(winningPattern);
        updateScore(currentPlayer);
        createConfetti();
        return;
    }

    if (!board.includes('')) {
        gameActive = false;
        statusDisplay.textContent = "It's a Draw!";
        updateScore('draw');
        return;
    }
}

// Highlight winning cells
function highlightWinningCells(pattern) {
    pattern.forEach(index => {
        cells[index].classList.add('winning');
    });
}

// Update status message
function updateStatus() {
    statusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
    statusDisplay.classList.remove('winner');
}

// Reset game
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    statusDisplay.classList.remove('winner');
    updateStatus();

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winning');
        cell.disabled = false;
    });
}

// Toggle game mode
function toggleMode() {
    vsAI = !vsAI;
    modeBtn.textContent = vsAI ? 'Play vs Player' : 'Play vs AI';
    resetGame();
}

// Update score
function updateScore(winner) {
    if (winner === 'draw') {
        scores.draw++;
    } else {
        scores[winner]++;
    }
    saveScores();
    updateScoreDisplay();
}

// Update score display
function updateScoreDisplay() {
    scoreXDisplay.textContent = scores.X;
    scoreODisplay.textContent = scores.O;
    scoreDrawDisplay.textContent = scores.draw;
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

// Load scores from localStorage
function loadScores() {
    const savedScores = localStorage.getItem('ticTacToeScores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
    }
}

// Create confetti animation
function createConfetti() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffd700'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            document.body.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 30);
    }
}

// Initialize the game when DOM is loaded
init();
