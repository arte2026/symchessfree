/* SymChess AI Bot
 * Load after main_ai.js. The chess rules and board/UI routines stay in main_ai.js.
 * Configure AI_COLOR with setAIColor("white") or setAIColor("black").
 */
// AI is a separate module from the game's board/rules code.
// AI_COLOR is the color played by the bot. Change it through setAIColor("white"/"black").
let AI_SEARCH_DEPTH = 2;
const savedDifficulty = sessionStorage.getItem("aiDifficulty");
if (savedDifficulty !== null && Number.isFinite(Number(savedDifficulty))) {
  AI_SEARCH_DEPTH = Math.max(1, Math.min(4, parseInt(savedDifficulty, 10)));
}
let AI_COLOR = "black";

function isAITurn() {
  return AI_COLOR === "white" ? isWhiteTurn : !isWhiteTurn;
}

// Change the bot's side immediately without reloading the page.
// Call this after ai-bot.js has loaded in the HTML page that should use this side.
function setAIColor(color) {
  if (color !== "white" && color !== "black") {
    console.error('AI color must be "white" or "black".');
    return;
  }

  AI_COLOR = color;
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";

  // If the selected bot side is already to move (e.g. White at the start),
  // let it make its move without requiring a reload.
  if (isAITurn() && allowMovement) {
    setTimeout(makeAIMove, 800);
  }
}

function setDifficultyAndReload(depth) {
  const parsedDepth = Number(depth);
  if (!Number.isInteger(parsedDepth) || parsedDepth < 1 || parsedDepth > 4) return;
  sessionStorage.setItem("aiDifficulty", String(parsedDepth));
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
  window.location.reload();
}

function makeAIMove() {
  if (!isAITurn() || !allowMovement) return;

  const possibleMoves = getAllMovesForColor(AI_COLOR, boardSquaresArray);
  if (possibleMoves.length === 0) return;

  const aiMaximizes = AI_COLOR === "black"; // Board evaluation scores are positive for Black.
  let bestMove = null;
  let bestValue = aiMaximizes ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  // Shuffle equal-scoring options to add a little variety between games.
  possibleMoves.sort(() => Math.random() - 0.5);

  for (const move of possibleMoves) {
    const simulatedBoard = deepCopyArray(boardSquaresArray);
    simulateMoveOnBoard(move, simulatedBoard);

    // After White's move, Black maximizes the score; after Black's move, White minimizes it.
    const boardValue = minimax(
      simulatedBoard,
      AI_SEARCH_DEPTH - 1,
      AI_COLOR === "white",
      alpha,
      beta
    );

    if ((aiMaximizes && boardValue > bestValue) || (!aiMaximizes && boardValue < bestValue)) {
      bestValue = boardValue;
      bestMove = move;
    }

    if (aiMaximizes) alpha = Math.max(alpha, bestValue);
    else beta = Math.min(beta, bestValue);
  }

  if (bestMove) performAIMove(bestMove);
}

// --- THE BRAIN: Minimax Algorithm ---
function minimax(board, depth, isMaximizingPlayer, alpha, beta) {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  const sideToMove = isMaximizingPlayer ? "black" : "white";
  const moves = getAllMovesForColor(sideToMove, board);

  if (moves.length === 0) {
    const king = board.find(sq => sq.pieceType === "king" && sq.pieceColor === sideToMove);
    const inCheck = king ? isKingInCheck(king.squareId, sideToMove, board) : false;
    if (!inCheck) return 0; // Stalemate.
    const mateScore = 100000 + depth;
    return sideToMove === "black" ? -mateScore : mateScore;
  }
// --- ADD MOVE ORDERING HERE ---
// Sort moves to evaluate captures first. This makes Alpha-Beta pruning exponentially faster.
moves.sort((a, b) => {
  const targetA = board.find(sq => sq.squareId === a.to);
  const targetB = board.find(sq => sq.squareId === b.to);
  
  const scoreA = (targetA && targetA.pieceType !== "blank") ? getPieceValue(targetA.pieceType) : 0;
  const scoreB = (targetB && targetB.pieceType !== "blank") ? getPieceValue(targetB.pieceType) : 0;
  
  return scoreB - scoreA; // Descending order (highest value captures first)
});
// ------------------------------
  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      let simBoard = deepCopyArray(board);
      simulateMoveOnBoard(move, simBoard);
      let childEval = minimax(simBoard, depth - 1, false, alpha, beta);
      maxEval = Math.max(maxEval, childEval);
      alpha = Math.max(alpha, childEval);
      if (beta <= alpha) break; // Prune
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      let simBoard = deepCopyArray(board);
      simulateMoveOnBoard(move, simBoard);
      let childEval = minimax(simBoard, depth - 1, true, alpha, beta);
      minEval = Math.min(minEval, childEval);
      beta = Math.min(beta, childEval);
      if (beta <= alpha) break; // Prune
    }
    return minEval;
  }
}

// --- HELPER: Simulate Move without DOM ---
function simulateMoveOnBoard(move, board) {
  const fromSq = board.find(sq => sq.squareId === move.from);
  const toSq = board.find(sq => sq.squareId === move.to);
  if (!fromSq || !toSq || fromSq.pieceColor === "blank") return;

  const movingColor = fromSq.pieceColor;
  const movingType = fromSq.pieceType;
  const originalId = fromSq.pieceId;

  // En passant captures a pawn on the square behind the destination.
  if (movingType === "pawn" && move.to === enPassantSquare && toSq.pieceColor === "blank") {
    const capturedRank = Number(move.to[1]) + (movingColor === "white" ? -1 : 1);
    const capturedSquare = board.find(sq => sq.squareId === move.to[0] + capturedRank);
    if (capturedSquare) {
      capturedSquare.pieceColor = "blank";
      capturedSquare.pieceType = "blank";
      capturedSquare.pieceId = "blank";
    }
  }

  // Castling moves both the king and its rook in the simulated position.
  const castling = movingType === "king" && move.from[1] === move.to[1] && Math.abs(move.from.charCodeAt(0) - move.to.charCodeAt(0)) > 1;
  let rookSource = null;
  let rookTarget = null;
  let rookData = null;
  if (castling) {
    const rank = move.from[1];
    const kingSide = move.to[0] === "g";
    const rookFiles = kingSide ? ["h", "g", "f", "e"] : ["a", "b", "c", "d"];
    rookSource = rookFiles.map(file => board.find(sq => sq.squareId === file + rank))
      .find(sq => sq && sq.pieceType === "rook" && sq.pieceColor === movingColor);
    rookTarget = board.find(sq => sq.squareId === (kingSide ? "f" : "d") + rank);
    if (rookSource && rookTarget) rookData = { pieceColor: rookSource.pieceColor, pieceType: rookSource.pieceType, pieceId: rookSource.pieceId };
  }

  // Clear the origin and, when castling, the rook's source before placing the pieces.
  fromSq.pieceColor = fromSq.pieceType = fromSq.pieceId = "blank";
  if (castling && rookSource && rookTarget && rookSource !== fromSq) {
    rookSource.pieceColor = rookSource.pieceType = rookSource.pieceId = "blank";
  }

  toSq.pieceColor = movingColor;
  toSq.pieceType = movingType === "pawn" && (move.to[1] === "1" || move.to[1] === "8") ? "queen" : movingType;
  toSq.pieceId = toSq.pieceType === movingType ? originalId : "queen" + originalId;

  if (castling && rookData && rookTarget) {
    rookTarget.pieceColor = rookData.pieceColor;
    rookTarget.pieceType = rookData.pieceType;
    rookTarget.pieceId = rookData.pieceId;
  }
}
// --- STRATEGY: Piece-Square Tables ---
// These arrays encourage the bot to move pieces to better squares (e.g., center)
// Values are relative to White's perspective. For Black, we mirror or reverse read.

const pawnTable = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 30, 30, 10,  5,  5,
    0,  0,  0, 25, 25,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
];

const knightTable = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
];

const bishopTable = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
];

const rookTable = [
      0,  0,  0,  0,  0,  0,  0,  0,
      15, 20, 20, 20, 20, 20, 20,  15,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
];

const queenTable = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
];

const kingTable = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-40,-40,-40,-40,-30,
    -30,-40,-40,-30,-30,-40,-40,-30,
    -30,-40,-40,-40,-40,-40,-40,-30,
    -20,-30,-30,-30,-30,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
];

// --- EVALUATION FUNCTION ---
function evaluateBoard(board) {
  let score = 0;
  
  board.forEach(square => {
    if (square.pieceColor === "blank") return;

    // 1. Material Value
    let material = getPieceValue(square.pieceType);

    // 2. Positional Value
    let positionScore = 0;
    
    // Convert "a1" to 0-63 index
    const file = square.squareId.charCodeAt(0) - 97; // a=0, h=7
    const rank = parseInt(square.squareId[1]) - 1;   // 1=0, 8=7
    let index = (7 - rank) * 8 + file; // 0 is top-left (a8), 63 is bottom-right (h1)

    // Reverse index for Black to mirror the board strategy
    if (square.pieceColor === "black") {
        index = 63 - index; 
    }

    if (square.pieceType === 'pawn') positionScore = pawnTable[index];
    if (square.pieceType === 'knight') positionScore = knightTable[index];
    if (square.pieceType === 'bishop') positionScore = bishopTable[index];
    if (square.pieceType === 'rook') positionScore = rookTable[index];
    if (square.pieceType === 'queen') positionScore = queenTable[index];
    if (square.pieceType === 'king') positionScore = kingTable[index];
    // (You can add tables for Bishop/Rook/Queen/King similarly)

    if (square.pieceColor === "black") {
      score += (material + positionScore);
    } else {
      score -= (material + positionScore);
    }
  });
  return score;
}

// --- KEEP YOUR EXISTING HELPERS ---
// Keep: performAIMove, getPieceValue, getAllMovesForColor (updated below)

function getAllMovesForColor(color, currentBoard) {
  let allMoves = [];
  const myPieces = currentBoard.filter(sq => sq.pieceColor === color);

  for (const square of myPieces) {
    const pieceObject = {
      pieceColor: square.pieceColor,
      pieceType: square.pieceType,
      pieceId: square.pieceId
    };

    // 1. Get raw moves from the engine
    let rawMoves = getPossibleMoves(square.squareId, pieceObject, currentBoard);

    // 2. STRICT CASTLING CHECK (Fixes the "Jumping over Bishop" bug)
    if (square.pieceType === "king") {
        rawMoves = rawMoves.filter(dest => {
            // Calculate distance (Castling is always > 1 step)
            let startFile = square.squareId.charCodeAt(0);
            let endFile = dest.charCodeAt(0);
            let fileDiff = Math.abs(endFile - startFile);
            
            if (fileDiff > 1) {
                // It is a castle move. Check the path!
                let rank = square.squareId[1];
                let direction = (endFile > startFile) ? 1 : -1;
                let checkFile = startFile + direction;
                
                // Loop through squares BETWEEN start and end
                while (checkFile !== endFile) {
                   let pathSquareId = String.fromCharCode(checkFile) + rank;
                   let pathSquare = currentBoard.find(s => s.squareId === pathSquareId);
                   
                   // If any square in the middle has a piece, BLOCK this move
                   if (pathSquare && pathSquare.pieceColor !== "blank") {
                       return false; 
                   }
                   checkFile += direction;
                }
            }
            return true; // Path is clear or not a castle
        });
    }

    // 3. Filter out suicide moves (Using the function you just pasted)
    let legalDestinations = isMoveValidAgainstCheck(
        rawMoves,
        square.squareId,
        color,
        square.pieceType,
        currentBoard
    );

    legalDestinations.forEach(destId => {
      allMoves.push({ from: square.squareId, to: destId });
    });
  }
  return allMoves;
}

function getPieceValue(type) {
  const values = {
    pawn: 10,
    knight: 30,
    bishop: 35,
    rook: 50,
    queen: 90,
    king: 900
  };
  return values[type] || 0;
}
function performAIMove(move) {
  const fromSquare = document.getElementById(move.from);
  const toSquare = document.getElementById(move.to);
  if (!fromSquare || !toSquare) return;

  const piece = fromSquare.querySelector(".piece");
  if (!piece) return;

  const pieceType = piece.classList[1];
  const pieceColor = piece.getAttribute("color") || (piece.classList.contains("white") ? "white" : "black");
  if (pieceColor !== AI_COLOR || !isAITurn()) return;

  // Castling is handled by the existing board routine, which moves king and rook and updates state.
  const isCastlingTarget = pieceType === "king" && move.from[1] === move.to[1] &&
    (move.to[0] === "g" || move.to[0] === "c") && Math.abs(move.from.charCodeAt(0) - move.to.charCodeAt(0)) > 1;
  if (isCastlingTarget) {
    performCastling(piece, pieceColor, move.from, move.to, boardSquaresArray);
    return;
  }

  const existingPiece = toSquare.querySelector(".piece");
  let captured = !!existingPiece;

  // Handle en passant, where the destination square is empty but a pawn is captured behind it.
  const isEnPassant = pieceType === "pawn" && move.to === enPassantSquare && !existingPiece;
  if (isEnPassant) {
    const capturedRank = Number(move.to[1]) + (pieceColor === "white" ? -1 : 1);
    const capturedSquare = document.getElementById(move.to[0] + capturedRank);
    const capturedPawn = capturedSquare && capturedSquare.querySelector(".piece");
    if (capturedPawn) capturedSquare.removeChild(capturedPawn);
    const capturedEntry = boardSquaresArray.find(sq => sq.squareId === move.to[0] + capturedRank);
    if (capturedEntry) {
      capturedEntry.pieceColor = "blank";
      capturedEntry.pieceType = "blank";
      capturedEntry.pieceId = "blank";
    }
    captured = true;
  }

  if (existingPiece) toSquare.removeChild(existingPiece);
  toSquare.appendChild(piece);

  let promotedType = "blank";
  const promotionRank = pieceColor === "white" ? "8" : "1";
  if (pieceType === "pawn" && move.to[1] === promotionRank) {
    const image = piece.querySelector("img");
    if (image) image.src = `${pieceColor === "white" ? "White" : "Black"}-Queen3.png`;
    piece.classList.remove("pawn");
    piece.classList.add("queen");
    piece.id = "queen" + piece.id;
    promotedType = "queen";
  }

  enPassantSquare = "blank";
  updateBoardSquaresArray(move.from, move.to, boardSquaresArray, promotedType);
  makeMove(move.from, move.to, pieceType, pieceColor, captured, promotedType);

  playMoveSound();
  highlightMovedPiece(piece);
  if (!hasGameStarted) hasGameStarted = true;
  applyIncrement();
  isWhiteTurn = !isWhiteTurn;
  startClock();
  checkForEndGame();
}

// If the AI is configured to play White, make its opening move after the board is initialized.
if (isAITurn()) {
  setTimeout(makeAIMove, 800);
}
