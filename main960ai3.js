let boardSquaresArray = [];
let positionArray = [];
let moves = [];

let isWhiteTurn = true;
let enPassantSquare = "blank";
let allowMovement = true;
const boardSquares = document.getElementsByClassName("square");
const pieces = document.getElementsByClassName("piece");
const piecesImages = document.getElementsByTagName("img");
const chessBoard = document.querySelector(".chessBoard");
let moveHistory = [];
let touchPiece = null;
let touchStartSquareId = null;

setupBoardSquares();
setupPieces();
fillBoardSquaresArray();
updateClocks();

const moveSound = document.getElementById("moveSound");
const victorySound = document.getElementById("victorySound");

const pieceNotation = {
  pawn: "♙",
  knight: "♘",
  bishop: "♗",
  rook: "♖",
  queen: "♕",
  king: "♔"
};
function addMoveToHistory(from, to, pieceType, color) {
    const symbol = pieceNotation[pieceType] || "";
const moveText = `${symbol.toUpperCase()}: ${from}-${to}`;

    if (color === "white") {
        moveHistory.push([moveText]);
    } else {
        moveHistory[moveHistory.length - 1].push(moveText);
    }

    renderMoveHistory();
}
function renderMoveHistory() {
    const list = document.getElementById("move-list");
    list.innerHTML = "";

    moveHistory.forEach((pair, index) => {
        const li = document.createElement("li");

        const moveNumber = index + 1;
        const whiteMove = pair[0] || "";
        const blackMove = pair[1] || "";

        li.textContent = `${moveNumber}. ${whiteMove} ${blackMove}`;
        list.appendChild(li);
    });
}
document.getElementById("toggle-history").addEventListener("click", () => {
    document.getElementById("history-panel").classList.toggle("hidden");
});

// Function to play the end-game sound
function playVictorySound() {
  if (!victorySound) return;
  victorySound.currentTime = 0; 
  victorySound.play().catch(() => {
    console.log("Browser blocked auto-play");
  });
}
function playMoveSound() {
  if (!moveSound) return;
  moveSound.currentTime = 0; // allow rapid consecutive moves
  moveSound.play().catch(() => {
    // Android may block sound until first user interaction
  });
}
function clearLastMovedPiece() {
  document
    .querySelectorAll(".last-moved-piece")
    .forEach(p => p.classList.remove("last-moved-piece"));
}

function highlightMovedPiece(piece) {
  if (!piece) return;
  clearLastMovedPiece();
  piece.classList.add("last-moved-piece");
}

function onTouchStart(e) {
  if (!allowMovement) return;
  e.preventDefault();
  touchPiece = e.currentTarget;

  const pieceColor = touchPiece.getAttribute("color");
  if (
    (isWhiteTurn && pieceColor !== "white") ||
    (!isWhiteTurn && pieceColor !== "black")
  ) return;

  touchStartSquareId = touchPiece.parentElement.id;
  
  e.target.style.visibility = "hidden";

  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
}

function onTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  touchPiece.style.position = "absolute";
  touchPiece.style.zIndex = "1000";
  touchPiece.style.left = `${touch.clientX - 25}px`;
  touchPiece.style.top = `${touch.clientY - 25}px`;
}

function onTouchEnd(e) {
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);
  
  if (touchPiece) {
  touchPiece.style.visibility = "visible";
}

  const touch = e.changedTouches[0];
  const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);

  const destinationSquare = targetElem?.closest(".square");
  if (destinationSquare) {
    simulateDrop(touchPiece, destinationSquare, touchStartSquareId);
  }

  touchPiece.style.position = "";
  touchPiece.style.zIndex = "";
  touchPiece.style.left = "";
  touchPiece.style.top = "";

  touchPiece = null;
  touchStartSquareId = null;
}

function simulateDrop(piece, destinationSquare, startingSquareId) {
  const event = {
    currentTarget: destinationSquare,
    dataTransfer: {
      getData: (type) => {
        if (type === "text") return piece.id + "|" + startingSquareId;
        if (type === "application/json") {
          const pieceColor = piece.getAttribute("color");
          const pieceType = piece.classList[1];
          const pieceObject = {
            pieceColor,
            pieceType,
            pieceId: piece.id,
          };
          let legalSquares = getPossibleMoves(
            startingSquareId,
            pieceObject,
            boardSquaresArray
          );
          legalSquares = isMoveValidAgainstCheck(
            legalSquares,
            startingSquareId,
            pieceColor,
            pieceType
          );
          return JSON.stringify(legalSquares);
        }
        return "";
      }
    },
    preventDefault: () => {}
  };

  drop(event);
}

function fillBoardSquaresArray() {
  const boardSquares = document.getElementsByClassName("square");
  for (let i = 0; i < boardSquares.length; i++) {
    let row = 8 - Math.floor(i / 8);
    let column = String.fromCharCode(97 + (i % 8));
    let square = boardSquares[i];
    square.id = column + row;
    let color = "";
    let pieceType = "";
    let pieceId = "";
    if (square.querySelector(".piece")) {
      color = square.querySelector(".piece").getAttribute("color");
      pieceType = square.querySelector(".piece").classList[1];
      pieceId = square.querySelector(".piece").id;
    } else {
      color = "blank";
      pieceType = "blank";
      pieceId = "blank";
    }
    let arrayElement = {
      squareId: square.id,
      pieceColor: color,
      pieceType: pieceType,
      pieceId: pieceId,
    };
    boardSquaresArray.push(arrayElement);
  }
}
function updateBoardSquaresArray(
  currentSquareId,
  destinationSquareId,
  boardSquaresArray,
  promotionOption = "blank"
) {
  let currentSquare = boardSquaresArray.find(
    (element) => element.squareId === currentSquareId
  );
  let destinationSquareElement = boardSquaresArray.find(
    (element) => element.squareId === destinationSquareId
  );
  let pieceColor = currentSquare.pieceColor;
  let pieceType =
    promotionOption == "blank" ? currentSquare.pieceType : promotionOption;
  let pieceId =
    promotionOption == "blank"
      ? currentSquare.pieceId
      : promotionOption + currentSquare.pieceId;
  destinationSquareElement.pieceColor = pieceColor;
  destinationSquareElement.pieceType = pieceType;
  destinationSquareElement.pieceId = pieceId;
  currentSquare.pieceColor = "blank";
  currentSquare.pieceType = "blank";
  currentSquare.pieceId = "blank";
}

function makeMove(
  startingSquareId,
  destinationSquareId,
  pieceType,
  pieceColor,
  captured,
  promotedTo = "blank"
) {
  moves.push({
    from: startingSquareId,
    to: destinationSquareId,
    pieceType: pieceType,
    pieceColor: pieceColor,
    captured: captured,
    promotedTo: promotedTo,
  });
      addMoveToHistory(startingSquareId, destinationSquareId, pieceType, pieceColor);  
}

function generateFEN(boardSquares){
  let fen="";
  let rank=8;
  while(rank>=1){
    for(let file="a";file<="h";file=String.fromCharCode(file.charCodeAt(0)+1)){
      const square = boardSquares.find((element)=>element.squareId===`${file}${rank}`);
      if(square && square.pieceType){
        let pieceNotation ="";
        switch (square.pieceType){
          case "pawn":
            pieceNotation = "p";
            break;
            case "bishop":
            pieceNotation = "b";
            break;
            case "knight":
            pieceNotation = "n";
            break;
            case "rook":
            pieceNotation = "r";
            break;
            case "queen":
            pieceNotation = "q";
            break;
            case "king":
            pieceNotation = "k";
            break;
            case "blank":
            pieceNotation = "blank";
            break;
        }
        fen+=square.pieceColor === "white" ? pieceNotation.toUpperCase() : pieceNotation;
      }
    }
    if(rank>1) {
      fen+="/";
    }
    rank--;
  }
  fen=fen.replace(new RegExp("blankblankblankblankblankblankblankblank","g"),"8");
  fen=fen.replace(new RegExp("blankblankblankblankblankblankblank","g"),"7");
  fen=fen.replace(new RegExp("blankblankblankblankblankblank","g"),"6");
  fen=fen.replace(new RegExp("blankblankblankblankblank","g"),"5");
  fen=fen.replace(new RegExp("blankblankblankblank","g"),"4");
  fen=fen.replace(new RegExp("blankblankblank","g"),"3");
  fen=fen.replace(new RegExp("blankblank","g"),"2");
  fen=fen.replace(new RegExp("blank","g"),"1");

  fen+= isWhiteTurn ? " w " : " b ";

  let castlingString="";

  let shortCastlePossibleForWhite = !kingHasMoved("white") &&!rookHasMoved("white","h1");
  let longCastlePossibleForWhite = !kingHasMoved("white") &&!rookHasMoved("white","a1");
  let shortCastlePossibleForBlack = !kingHasMoved("black") &&!rookHasMoved("black","h8");
  let longCastlePossibleForBlack = !kingHasMoved("black") &&!rookHasMoved("black","a8");

  if(shortCastlePossibleForWhite) castlingString+="K";
  if(longCastlePossibleForWhite) castlingString+="Q";
  if(shortCastlePossibleForBlack) castlingString+="k";
  if(longCastlePossibleForBlack) castlingString+="q";
  if(castlingString=="") castlingString+="-";
  castlingString+=" ";
  fen+=castlingString;

  fen+=enPassantSquare=="blank" ? "-" : enPassantSquare;

  let fiftyMovesRuleCount=getFiftyMovesRuleCount();
  fen+=" "+fiftyMovesRuleCount;
  let moveCount=Math.floor(moves.length/2)+1;
  fen+=" "+moveCount;
  console.log(fen);
  return fen;


}

function performCastling(
  kingPiece,
  pieceColor,
  kingStartId,
  rookStartId, // In our 960 UI, destinationSquareId is the Rook's square
  boardSquaresArray
) {
  let rank = pieceColor === "white" ? "1" : "8";
  
  // Determine kingside or queenside based on file characters
  let isKingside = rookStartId.charCodeAt(0) > kingStartId.charCodeAt(0);
  
  let kingDestId = (isKingside ? "g" : "c") + rank;
  let rookDestId = (isKingside ? "f" : "d") + rank;

  // Get the Rook element
  // Since you set IDs dynamically based on class and parent, we find it safely:
  let rookElement = document.getElementById(rookStartId).querySelector(".piece");

  const kingDestSquare = document.getElementById(kingDestId);
  const rookDestSquare = document.getElementById(rookDestId);

  // Clear original squares in the array manually to prevent overwriting bugs during swap
  let kSq = boardSquaresArray.find((e) => e.squareId === kingStartId);
  let rSq = boardSquaresArray.find((e) => e.squareId === rookStartId);
  let tempRookType = rSq.pieceType;
  let tempRookId = rSq.pieceId;
  
  kSq.pieceColor = "blank"; kSq.pieceType = "blank"; kSq.pieceId = "blank";
  rSq.pieceColor = "blank"; rSq.pieceType = "blank"; rSq.pieceId = "blank";

  // Move DOM elements
  kingDestSquare.appendChild(kingPiece);
  rookDestSquare.appendChild(rookElement);
  
  // Update Array for King
  let kDestSq = boardSquaresArray.find((e) => e.squareId === kingDestId);
  kDestSq.pieceColor = pieceColor;
  kDestSq.pieceType = "king";
  kDestSq.pieceId = kingPiece.id;

  // Update Array for Rook
  let rDestSq = boardSquaresArray.find((e) => e.squareId === rookDestId);
  rDestSq.pieceColor = pieceColor;
  rDestSq.pieceType = tempRookType;
  rDestSq.pieceId = tempRookId;

  highlightMovedPiece(kingPiece);
  playMoveSound();
  applyIncrement();
  isWhiteTurn = !isWhiteTurn;

  // Record moves (we record the king moving to its traditional castling square)
  makeMove(kingStartId, kingDestId, "king", pieceColor, false);
  checkForEndGame();
  // --- FIX: TRIGGER AI HERE ---
  if (isWhiteTurn) {
    setTimeout(makeAIMove, 800); 
  }
  return;
}

function performEnPassant(
  piece,
  pieceColor,
  startingSquareId,
  destinationSquareId
) {
  let file = destinationSquareId[0];
  let rank = parseInt(destinationSquareId[1]);
  rank += pieceColor === "white" ? -1 : 1;
  let squareBehindId = file + rank;

  const squareBehindElement = document.getElementById(squareBehindId);
  while (squareBehindElement.firstChild) {
    squareBehindElement.removeChild(squareBehindElement.firstChild);
  }

  let squareBehind = boardSquaresArray.find(
    (element) => element.squareId === squareBehindId
  );
  squareBehind.pieceColor = "blank";
  squareBehind.pieceType = "blank";
  squareBehind.pieceId = "blank";

  const destinationSquare = document.getElementById(destinationSquareId);
  destinationSquare.appendChild(piece);
  highlightMovedPiece(piece);
  playMoveSound();
  applyIncrement();
  isWhiteTurn = !isWhiteTurn;
  updateBoardSquaresArray(
    startingSquareId,
    destinationSquareId,
    boardSquaresArray
  );
  let captured = true;
  makeMove(startingSquareId, destinationSquareId, "pawn", pieceColor, captured);
  enPassantSquare="blank";
  checkForEndGame();
  // --- FIX: TRIGGER AI HERE ---
  if (isWhiteTurn) {
    setTimeout(makeAIMove, 800); 
  }
  
  return;
  
}
function displayPromotionChoices(
  pieceId,
  pieceColor,
  startingSquareId,
  destinationSquareId,
  captured
) {
  let file = destinationSquareId[0];
  let rank = parseInt(destinationSquareId[1]);
  let rank1 = pieceColor === "white" ? rank - 1 : rank + 1;
  let rank2 = pieceColor === "white" ? rank - 2 : rank + 2;
  let rank3 = pieceColor === "white" ? rank - 3 : rank + 3;

  let squareBehindId1 = file + rank1;
  let squareBehindId2 = file + rank2;
  let squareBehindId3 = file + rank3;

  const destinationSquare = document.getElementById(destinationSquareId);
  const squareBehind1 = document.getElementById(squareBehindId1);
  const squareBehind2 = document.getElementById(squareBehindId2);
  const squareBehind3 = document.getElementById(squareBehindId3);

  let piece1 = createChessPiece("queen", pieceColor, "promotionOption");
  let piece2 = createChessPiece("knight", pieceColor, "promotionOption");
  let piece3 = createChessPiece("rook", pieceColor, "promotionOption");
  let piece4 = createChessPiece("bishop", pieceColor, "promotionOption");

  destinationSquare.appendChild(piece1);
  squareBehind1.appendChild(piece2);
  squareBehind2.appendChild(piece3);
  squareBehind3.appendChild(piece4);

  let promotionOptions = document.getElementsByClassName("promotionOption");
  for (let i = 0; i < promotionOptions.length; i++) {
    let pieceType = promotionOptions[i].classList[1];
    promotionOptions[i].addEventListener("click", function () {
      performPromotion(
        pieceId,
        pieceType,
        pieceColor,
        startingSquareId,
        destinationSquareId,
        captured
      );
    });
  }
}

function createChessPiece(pieceType, color, pieceClass) {
  let pieceName =
    color.charAt(0).toUpperCase() +
    color.slice(1) +
    "-" +
    pieceType.charAt(0).toUpperCase() +
    pieceType.slice(1) +
    "2.png";
  let pieceDiv = document.createElement("div");
  pieceDiv.className = `${pieceClass} ${pieceType}`;
  pieceDiv.setAttribute("color", color);
  let img = document.createElement("img");
  img.src = pieceName;
  img.alt = pieceType;
  pieceDiv.appendChild(img);
  return pieceDiv;
}

chessBoard.addEventListener("click", clearPromotionOptions);

function clearPromotionOptions() {
  for (let i = 0; i < boardSquares.length; i++) {
    let style = getComputedStyle(boardSquares[i]);
    let backgroundColor = style.backgroundColor;
    let rgbaColor = backgroundColor.replace("0.5)", "1)");
    boardSquares[i].style.backgroundColor = rgbaColor;
    boardSquares[i].style.opacity = 1;

    if (boardSquares[i].querySelector(".piece"))
      boardSquares[i].querySelector(".piece").style.opacity = 1;
  }
  let elementsToRemove = chessBoard.querySelectorAll(".promotionOption");
  elementsToRemove.forEach(function (element) {
    element.parentElement.removeChild(element);
  });
  allowMovement = true;
}

function updateBoardSquaresOpacity(startingSquareId) {
  for (let i = 0; i < boardSquares.length; i++) {
    
    if(boardSquares[i].id==startingSquareId)
    boardSquares[i].querySelector(".piece").style.opacity = 0;

    if (!boardSquares[i].querySelector(".promotionOption")) {
      boardSquares[i].style.opacity = 0.5;
    } else {
      let style = getComputedStyle(boardSquares[i]);
      let backgroundColor = style.backgroundColor;
      let rgbaColor = backgroundColor
        .replace("rgb", "rgba")
        .replace(")", ",0.5)");
      boardSquares[i].style.backgroundColor = rgbaColor;

      if (boardSquares[i].querySelector(".piece"))
        boardSquares[i].querySelector(".piece").style.opacity = 0;
    }
  }
}

function performPromotion(
  pieceId,
  pieceType,
  pieceColor,
  startingSquareId,
  destinationSquareId,
  captured
) {
  clearPromotionOptions();
  promotionPiece = pieceType;
  piece = createChessPiece(pieceType, pieceColor, "piece");

  piece.addEventListener("dragstart", drag);
  
  // 🫵 ADD THIS LINE for touch support
  piece.addEventListener("touchstart", onTouchStart, { passive: false });
  
  piece.setAttribute("draggable", true);
  piece.firstChild.setAttribute("draggable", false);
  piece.id = pieceType + pieceId;

  const startingSquare = document.getElementById(startingSquareId);
  while (startingSquare.firstChild) {
    startingSquare.removeChild(startingSquare.firstChild);
  }
  const destinationSquare = document.getElementById(destinationSquareId);

  if (captured) {
    let children = destinationSquare.children;
    for (let i = 0; i < children.length; i++) {
      if (!children[i].classList.contains("coordinate")) {
        destinationSquare.removeChild(children[i]);
      }
    }
  }
  // while(destinationSquare.firstChild){
  //   destinationSquare.removeChild(destinationSquare.firstChild);
  // }
  destinationSquare.appendChild(piece);
  applyIncrement();
  isWhiteTurn = !isWhiteTurn;
  updateBoardSquaresArray(
    startingSquareId,
    destinationSquareId,
    boardSquaresArray,
    pieceType
  );
  makeMove(
    startingSquareId,
    destinationSquareId,
    pieceType,
    pieceColor,
    captured,
    pieceType
  );
  checkForEndGame();
  // --- FIX: TRIGGER AI HERE ---
  if (isWhiteTurn) {
    setTimeout(makeAIMove, 800); 
  }
  
  return;
}

function deepCopyArray(array) {
  let arrayCopy = array.map((element) => {
    return { ...element };
  });
  return arrayCopy;
}

function setupBoardSquares() {
  for (let i = 0; i < boardSquares.length; i++) {
    boardSquares[i].addEventListener("dragover", allowDrop);
    boardSquares[i].addEventListener("drop", drop);
    let row = 8 - Math.floor(i / 8);
    let column = String.fromCharCode(97 + (i % 8));
    let square = boardSquares[i];
    square.id = column + row;
  }
}
function setupPieces() {
  for (let i = 0; i < pieces.length; i++) {
    pieces[i].addEventListener("dragstart", drag);
    pieces[i].setAttribute("draggable", true);
    pieces[i].id =
      pieces[i].className.split(" ")[1] + pieces[i].parentElement.id;
	  
	  // 👇 Add this for touch support
    pieces[i].addEventListener("touchstart", onTouchStart, { passive: false });
  }
  for (let i = 0; i < piecesImages.length; i++) {
    piecesImages[i].setAttribute("draggable", false);
  }
}
function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  if (!allowMovement) return;

  const piece = ev.target;
  const pieceColor = piece.getAttribute("color");
  const pieceType = piece.classList[1];
  const pieceId = piece.id;
  if (
    (isWhiteTurn && pieceColor == "white") ||
    (!isWhiteTurn && pieceColor == "black")
  ) {
    const startingSquareId = piece.parentNode.id;
    ev.dataTransfer.setData("text", piece.id + "|" + startingSquareId);
    const pieceObject = {
      pieceColor: pieceColor,
      pieceType: pieceType,
      pieceId: pieceId,
    };
    let legalSquares = getPossibleMoves(
      startingSquareId,
      pieceObject,
      boardSquaresArray
    );
    let legalSquaresJson = JSON.stringify(legalSquares);
    ev.dataTransfer.setData("application/json", legalSquaresJson);
  }
}

function drop(ev) {
  ev.preventDefault();
  let data = ev.dataTransfer.getData("text");
  let [pieceId, startingSquareId] = data.split("|");
  let legalSquaresJson = ev.dataTransfer.getData("application/json");
  if (legalSquaresJson.length == 0) return;
  let legalSquares = JSON.parse(legalSquaresJson);

  const piece = document.getElementById(pieceId);
  const pieceColor = piece.getAttribute("color");
  const pieceType = piece.classList[1];

  const destinationSquare = ev.currentTarget;
  let destinationSquareId = destinationSquare.id;

  legalSquares = isMoveValidAgainstCheck(
    legalSquares,
    startingSquareId,
    pieceColor,
    pieceType
  );

  let squareContent = getPieceAtSquare(destinationSquareId, boardSquaresArray);
  let isCastling = (pieceType === "king" && squareContent.pieceType === "rook" && squareContent.pieceColor === pieceColor);

  if (!legalSquares.includes(destinationSquareId)) return;

  // Regular King move check (skip if castling, as it's already validated)
  if (pieceType === "king" && !isCastling) {
    if (isKingInCheck(destinationSquareId, pieceColor, boardSquaresArray)) return;
  }

  // Handle Castling
  if (isCastling) {
    performCastling(
      piece,
      pieceColor,
      startingSquareId,
      destinationSquareId,
      boardSquaresArray
    );
    return;
  }

  // Handle En Passant
  if (pieceType === "pawn" && enPassantSquare === destinationSquareId) {
    performEnPassant(piece, pieceColor, startingSquareId, destinationSquareId);
    return;
  }

  // Handle Promotion
  if (
    pieceType === "pawn" &&
    (destinationSquareId.charAt(1) == 8 || destinationSquareId.charAt(1) == 1)
  ) {
    allowMovement = false;
    displayPromotionChoices(
      pieceId,
      pieceColor,
      startingSquareId,
      destinationSquareId,
      squareContent.pieceColor !== "blank" // true if capturing
    );
    updateBoardSquaresOpacity(startingSquareId);
    return;
  }

  // Handle standard moves and captures
  enPassantSquare = "blank";
  let captured = squareContent.pieceColor !== "blank";

  if (captured) {
    let children = destinationSquare.children;
    for (let i = 0; i < children.length; i++) {
      if (!children[i].classList.contains("coordinate")) {
        destinationSquare.removeChild(children[i]);
      }
    }
  }

  destinationSquare.appendChild(piece);
  highlightMovedPiece(piece);
  if (!hasGameStarted) {
    hasGameStarted = true; // Flips the flag after White's first move
}
	applyIncrement();
    isWhiteTurn = !isWhiteTurn;
      startClock(); // Add this here
  
  updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
  makeMove(startingSquareId, destinationSquareId, pieceType, pieceColor, captured);
  
  playMoveSound();
  checkForEndGame();
  // --- FIX: TRIGGER AI HERE ---
  if (isWhiteTurn) {
    setTimeout(makeAIMove, 800); 
  }
  return;
}

function getPossibleMoves(startingSquareId, piece, boardSquaresArray) {
  const pieceColor = piece.pieceColor;
  const pieceType = piece.pieceType;
  let legalSquares = [];
  if (pieceType == "rook") {
    legalSquares = getRookMoves(
      startingSquareId,
      pieceColor,
      boardSquaresArray
    );
    return legalSquares;
  }
  if (pieceType == "bishop") {
    legalSquares = getBishopMoves(
      startingSquareId,
      pieceColor,
      boardSquaresArray
    );
    return legalSquares;
  }
  if (pieceType == "queen") {
    legalSquares = getQueenMoves(
      startingSquareId,
      pieceColor,
      boardSquaresArray
    );
    return legalSquares;
  }
  if (pieceType == "knight") {
    legalSquares = getKnightMoves(
      startingSquareId,
      pieceColor,
      boardSquaresArray
    );
    return legalSquares;
  }

  if (pieceType == "pawn") {
    legalSquares = getPawnMoves(
      startingSquareId,
      pieceColor,
      boardSquaresArray
    );
    return legalSquares;
  }
  if (pieceType == "king") {
    legalSquares = getKingMoves(
      startingSquareId,
      pieceColor,
      boardSquaresArray
    );
    return legalSquares;
  }
}

function getPawnMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let diogonalSquares = checkPawnDiagonalCaptures(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let forwardSquares = checkPawnForwardMoves(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let legalSquares = [...diogonalSquares, ...forwardSquares];
  return legalSquares;
}

function checkPawnDiagonalCaptures(
  startingSquareId,
  pieceColor,
  boardSquaresArray
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];
  let currentFile = file;
  let currentRank = rankNumber;
  let currentSquareId = currentFile + currentRank;

  const direction = pieceColor == "white" ? 1 : -1;
  if(!(rank==8 && direction==1) && !(rank==1 && direction==-1))
   currentRank += direction;
  for (let i = -1; i <= 1; i += 2) {
    currentFile = String.fromCharCode(file.charCodeAt(0) + i);
    if (currentFile >= "a" && currentFile <= "h" && currentRank<=8 && currentRank>=1){
      currentSquareId = currentFile + currentRank;
      let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent != pieceColor)
        legalSquares.push(currentSquareId);

      if (squareContent == "blank") {
        currentSquareId = currentFile + rank;
        let pawnStartingSquareRank = rankNumber + direction * 2;
        let pawnStartingSquareId = currentFile + pawnStartingSquareRank;

        if (
          enPassantPossible(currentSquareId, pawnStartingSquareId, direction)
        ) {
          let pawnStartingSquareRank = rankNumber + direction;
          let enPassantSquare = currentFile + pawnStartingSquareRank;
          legalSquares.push(enPassantSquare);
        }
      }
    }
  }
  return legalSquares;
}
function enPassantPossible(currentSquareId, pawnStartingSquareId, direction) {
  if (moves.length == 0) return false;
  let lastMove = moves[moves.length - 1];
  if (
    !(lastMove.to === currentSquareId && lastMove.from === pawnStartingSquareId)
  )
    return false;

  let file = currentSquareId[0];
  let rank = parseInt(currentSquareId[1]);
  rank += direction;
  let squareBehindId = file + rank;
  enPassantSquare = squareBehindId;
  return true;
}

function checkPawnForwardMoves(
  startingSquareId,
  pieceColor,
  boardSquaresArray
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];

  let currentFile = file;
  let currentRank = rankNumber;
  let currentSquareId = currentFile + currentRank;

  const direction = pieceColor == "white" ? 1 : -1;
  currentRank += direction;
  currentSquareId = currentFile + currentRank;
  let currentSquare = boardSquaresArray.find(
    (element) => element.squareId === currentSquareId
  );
  let squareContent = currentSquare.pieceColor;
  if (squareContent != "blank") return legalSquares;
  legalSquares.push(currentSquareId);
  if (
    !(
      (rankNumber == 2 && pieceColor == "white") ||
      (rankNumber == 7 && pieceColor == "black")
    )
  )
    return legalSquares;
  currentRank += direction;
  currentSquareId = currentFile + currentRank;
  currentSquare = boardSquaresArray.find(
    (element) => element.squareId === currentSquareId
  );
  squareContent = currentSquare.pieceColor;
  if (squareContent != "blank")
    if (squareContent != "blank") return legalSquares;
  legalSquares.push(currentSquareId);
  return legalSquares;
}

function getKnightMoves(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charCodeAt(0) - 97;
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];

  const moves = [
    [-2, 1],
    [-1, 2],
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
  ];
  moves.forEach((move) => {
    currentFile = file + move[0];
    currentRank = rankNumber + move[1];
    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
      let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
    }
  });
  return legalSquares;
}
function getRookMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let moveToEighthRankSquares = moveToEighthRank(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankSquares = moveToFirstRank(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToAFileSquares = moveToAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToHFileSquares = moveToHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let legalSquares = [
    ...moveToEighthRankSquares,
    ...moveToFirstRankSquares,
    ...moveToAFileSquares,
    ...moveToHFileSquares,
  ];
  return legalSquares;
}

function getBishopMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let moveToEighthRankHFileSquares = moveToEighthRankHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToEighthRankAFileSquares = moveToEighthRankAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankHFileSquares = moveToFirstRankHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankAFileSquares = moveToFirstRankAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let legalSquares = [
    ...moveToEighthRankHFileSquares,
    ...moveToEighthRankAFileSquares,
    ...moveToFirstRankHFileSquares,
    ...moveToFirstRankAFileSquares,
  ];
  return legalSquares;
}
function getQueenMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let bishopMoves = getBishopMoves(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let rookMoves = getRookMoves(startingSquareId, pieceColor, boardSquaresArray);
  let legalSquares = [...bishopMoves, ...rookMoves];
  return legalSquares;
}

function getStandardKingMoves(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charCodeAt(0) - 97;
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  const moves = [
    [0, 1], [0, -1], [1, 1], [1, -1], [-1, 0], [-1, 1], [-1, -1], [1, 0]
  ];

  moves.forEach((move) => {
    let currentFile = file + move[0];
    let currentRank = rankNumber + move[1];

    if (currentFile >= 0 && currentFile <= 7 && currentRank > 0 && currentRank <= 8) {
      let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor) {
        return; 
      }
      legalSquares.push(currentSquareId);
    }
  });
  return legalSquares;
}

function getKingMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let legalSquares = getStandardKingMoves(startingSquareId, pieceColor, boardSquaresArray);
  let castlingSquares = getCastlingSquares(startingSquareId, pieceColor, boardSquaresArray);
  return legalSquares.concat(castlingSquares);
}

function getCastlingSquares(startingSquareId, pieceColor, boardSquaresArray) {
  let legalSquares = [];
  let rank = pieceColor === "white" ? 1 : 8;
  if (kingHasMoved(pieceColor)) return legalSquares;

  // Find all friendly rooks that haven't moved
  let unmovedRooks = boardSquaresArray.filter(sq => 
    sq.pieceColor === pieceColor && 
    sq.pieceType === "rook" && 
    !rookHasMoved(pieceColor, sq.squareId)
  );

  let kingFileIdx = startingSquareId.charCodeAt(0);

  unmovedRooks.forEach(rookSquare => {
    let rookFileIdx = rookSquare.squareId.charCodeAt(0);
    
    // Determine if this is a Kingside (towards h) or Queenside (towards a) castle
    let isKingside = rookFileIdx > kingFileIdx;
    
    let kingTargetFileIdx = isKingside ? 'g'.charCodeAt(0) : 'c'.charCodeAt(0);
    let rookTargetFileIdx = isKingside ? 'f'.charCodeAt(0) : 'd'.charCodeAt(0);

    let pathIsClear = true;

    // 1. Check if squares between King and its target are empty (excluding King and the castling Rook)
    let kStart = Math.min(kingFileIdx, kingTargetFileIdx);
    let kEnd = Math.max(kingFileIdx, kingTargetFileIdx);
    for (let f = kStart; f <= kEnd; f++) {
      let sqId = String.fromCharCode(f) + rank;
      if (sqId !== startingSquareId && sqId !== rookSquare.squareId && getPieceAtSquare(sqId, boardSquaresArray).pieceColor !== "blank") {
        pathIsClear = false;
      }
    }

    // 2. Check if squares between Rook and its target are empty
    let rStart = Math.min(rookFileIdx, rookTargetFileIdx);
    let rEnd = Math.max(rookFileIdx, rookTargetFileIdx);
    for (let f = rStart; f <= rEnd; f++) {
      let sqId = String.fromCharCode(f) + rank;
      if (sqId !== startingSquareId && sqId !== rookSquare.squareId && getPieceAtSquare(sqId, boardSquaresArray).pieceColor !== "blank") {
        pathIsClear = false;
      }
    }

    // 3. Check if King passes through check (King start -> King target)
    if (pathIsClear) {
      let kPathStart = Math.min(kingFileIdx, kingTargetFileIdx);
      let kPathEnd = Math.max(kingFileIdx, kingTargetFileIdx);
      for (let f = kPathStart; f <= kPathEnd; f++) {
        let sqId = String.fromCharCode(f) + rank;
        // In full 960 rules, the king cannot be in check on its start square, its target square, or any square in between.
        if (isKingInCheck(sqId, pieceColor, boardSquaresArray)) {
           pathIsClear = false;
        }
      }
    }

    // If all rules pass, dragging the King ONTO the Rook is the legal castling move
    if (pathIsClear) {
      legalSquares.push(rookSquare.squareId);
    }
  });

  return legalSquares;
}

function kingHasMoved(pieceColor) {
  let result = moves.find(
    (element) =>
      element.pieceColor === pieceColor && element.pieceType === "king"
  );
  if (result != undefined) return true;
  return false;
}
function rookHasMoved(pieceColor, startingSquareId) {
  let result = moves.find(
    (element) =>
      element.pieceColor === pieceColor &&
      element.pieceType === "rook" &&
      element.from === startingSquareId
  );
  if (result != undefined) return true;
  return false;
}

function moveToEighthRank(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentRank = rankNumber;
  let legalSquares = [];
  while (currentRank != 8) {
    currentRank++;
    let currentSquareId = file + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToFirstRank(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentRank = rankNumber;
  let legalSquares = [];
  while (currentRank != 1) {
    currentRank--;
    let currentSquareId = file + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToAFile(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  let currentFile = file;
  let legalSquares = [];

  while (currentFile != "a") {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    let currentSquareId = currentFile + rank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToHFile(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  let currentFile = file;
  let legalSquares = [];
  while (currentFile != "h") {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    let currentSquareId = currentFile + rank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToEighthRankAFile(
  startingSquareId,
  pieceColor,
  boardSquaresArray
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "a" || currentRank == 8)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    currentRank++;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToEighthRankHFile(
  startingSquareId,
  pieceColor,
  boardSquaresArray
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "h" || currentRank == 8)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    currentRank++;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToFirstRankAFile(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "a" || currentRank == 1)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) - 1
    );
    currentRank--;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function moveToFirstRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];
  while (!(currentFile == "h" || currentRank == 1)) {
    currentFile = String.fromCharCode(
      currentFile.charCodeAt(currentFile.length - 1) + 1
    );
    currentRank--;
    let currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank" && squareContent == pieceColor)
      return legalSquares;
    legalSquares.push(currentSquareId);
    if (squareContent != "blank" && squareContent != pieceColor)
      return legalSquares;
  }
  return legalSquares;
}
function getPieceAtSquare(squareId, boardSquaresArray) {
  let currentSquare = boardSquaresArray.find(
    (element) => element.squareId === squareId
  );
  const color = currentSquare.pieceColor;
  const pieceType = currentSquare.pieceType;
  const pieceId = currentSquare.pieceId;
  return { pieceColor: color, pieceType: pieceType, pieceId: pieceId };
}

function isKingInCheck(squareId, pieceColor, boardSquaresArray) {
	// AI Guard: If the king was captured in an imaginary Minimax timeline, fail safely
  if (!squareId) return true;
  
  let legalSquares = getRookMoves(squareId, pieceColor, boardSquaresArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      (pieceProperties.pieceType == "rook" ||
        pieceProperties.pieceType == "queen") &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = getBishopMoves(squareId, pieceColor, boardSquaresArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      (pieceProperties.pieceType == "bishop" ||
        pieceProperties.pieceType == "queen") &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = getKnightMoves(squareId, pieceColor, boardSquaresArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      pieceProperties.pieceType == "knight" &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = checkPawnDiagonalCaptures(
    squareId,
    pieceColor,
    boardSquaresArray
  );
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      pieceProperties.pieceType == "pawn" &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  legalSquares = getStandardKingMoves(squareId, pieceColor, boardSquaresArray);
  for (let squareId of legalSquares) {
    let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
    if (
      pieceProperties.pieceType == "king" &&
      pieceColor != pieceProperties.pieceColor
    )
      return true;
  }
  return false;
}
function getKingSquare(pieceColor, boardSquaresArray) {
  let kingSquare = boardSquaresArray.find(
    (element) => element.pieceType === "king" && element.pieceColor === pieceColor
  );
  return kingSquare ? kingSquare.squareId : null;
}
function isMoveValidAgainstCheck(
  legalSquares,
  startingSquareId,
  pieceColor,
  pieceType,
  boardArray = boardSquaresArray // Allow AI to pass imaginary boards, defaults to global board
) {
  let legalSquaresCopy = legalSquares.slice();

  legalSquaresCopy.forEach((element) => {
    let destinationId = element;

    // 960 Fix: Skip check validation for castling here
    let targetSq = boardArray.find(sq => sq.squareId === destinationId);
    if (pieceType === "king" && targetSq && targetSq.pieceType === "rook" && targetSq.pieceColor === pieceColor) {
      return; // Keep it as legal
    }

    // Use the passed-in board array (crucial for Minimax)
    let boardSquaresArrayCopy = deepCopyArray(boardArray);
    updateBoardSquaresArray(
      startingSquareId,
      destinationId,
      boardSquaresArrayCopy
    );

    // Find exactly where the king is located AFTER the simulated move
    let kingSquareId = getKingSquare(pieceColor, boardSquaresArrayCopy);
// AI Guard: If this simulated move resulted in the king vanishing, discard the move
    if (!kingSquareId) {
      legalSquares = legalSquares.filter((item) => item != destinationId);
      return;
    }
    if (isKingInCheck(kingSquareId, pieceColor, boardSquaresArrayCopy)) {
      legalSquares = legalSquares.filter((item) => item != destinationId);
    }
  });
  return legalSquares;
}

function checkForEndGame(){
  checkForCheckMateAndStaleMate();
  let currentPosition = generateFEN(boardSquaresArray);
  positionArray.push(currentPosition);
  let threeFoldRepetition = isThreefoldRepetition();
  let insufficientMaterial = hasInsufficientMaterial(currentPosition);
  let fiftyMovesRuleCount = currentPosition.split(" ")[4];
  let fiftyMovesRule = fiftyMovesRuleCount!=100 ? false : true;
  let isDraw = threeFoldRepetition||insufficientMaterial || fiftyMovesRule;
  if(isDraw){
    allowMovement=false;
    // NEW WAY:
    showAlert(getTranslation("alert_draw"));

    document.addEventListener('dragstart', function(event) {
        event.preventDefault();
    });
     document.addEventListener('drop', function(event) {
        event.preventDefault();
    });
    
  }
}

function checkForCheckMateAndStaleMate() {
  let pieceColor = isWhiteTurn ? "white" : "black";
  let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
  
  // Find the king dynamically
  let kingSquareId = getKingSquare(pieceColor, boardSquaresArrayCopy);
  
  let kingIsCheck = isKingInCheck(
    kingSquareId,
    pieceColor,
    boardSquaresArrayCopy
  );
  
  let possibleMoves = getAllPossibleMoves(boardSquaresArrayCopy, pieceColor);
  if (possibleMoves.length > 0) return;
  
  let message = "";
  // NEW WAY: Apply translations based on the game state
  if(kingIsCheck) {
    isWhiteTurn ? (message = getTranslation("alert_black_wins")) : (message = getTranslation("alert_white_wins"));
  } else {
    message = getTranslation("alert_draw");
  }
  showAlert(message);
}
function getFiftyMovesRuleCount(){
  let count=0;
  for (let i=0;i<moves.length;i++){
    count++;
    if(moves[i].captured || moves[i].pieceType ==="pawn" || moves[i].promotedTo!="blank")
    count=0;
  }
  return count;
}
function isThreefoldRepetition(){
  return positionArray.some((string)=>{
    const fen = string.split(" ").slice(0,4).join(" ");
    return positionArray.filter(
      (element)=>element.split(" ").slice(0,4).join(" ")===fen
    ).length>=3
  });
}
function hasInsufficientMaterial(fen){
  const piecePlacement = fen.split(" ")[0];

  const whiteBishops = piecePlacement.split("").filter(char=>char==="B").length;
  const blackBishops = piecePlacement.split("").filter(char=>char==="b").length;
  const whiteKnights = piecePlacement.split("").filter(char=>char==="N").length;
  const blackKnights = piecePlacement.split("").filter(char=>char==="n").length;
  const whiteQueens = piecePlacement.split("").filter(char=>char==="Q").length;
  const blackQueens = piecePlacement.split("").filter(char=>char==="q").length;
  const whiteRooks = piecePlacement.split("").filter(char=>char==="R").length;
  const blackRooks = piecePlacement.split("").filter(char=>char==="r").length;
  const whitePawns = piecePlacement.split("").filter(char=>char==="P").length;
  const blackPawns = piecePlacement.split("").filter(char=>char==="p").length;
 
  if(whiteQueens+blackQueens+whiteRooks+blackRooks+whitePawns+blackPawns>0){
    return false;
  }

  if(whiteKnights+blackKnights>1){
    return false;
  }
  if(whiteKnights+blackKnights>1) {
    return false;
  }

  if((whiteBishops>0|| blackBishops>0)&&(whiteKnights+blackKnights>0))
    return false;

    if(whiteBishops>1 || blackBishops>1)
      return false;

    if(whiteBishops===1 && blackBishops===1){
      let whiteBishopSquareColor,blackBishopSquareColor;

      let whiteBishopSquare = boardSquaresArray.find(element=>(element.pieceType==="bishop" && element.pieceColor==="white"));
      let blackBishopSquare = boardSquaresArray.find(element=>(element.pieceType==="bishop" && element.pieceColor==="black"));

      whiteBishopSquareColor = getSqaureColor(whiteBishopSquare.squareId);
      blackBishopSquareColor = getSqaureColor(blackBishopSquare.squareId);

      if(whiteBishopSquareColor!== blackBishopSquareColor){
        return false;
      }
    }
    return true;
}
function getSqaureColor(squareId){
  let squareElement = document.getElementById(squareId);
  let squareColor = squareElement.classList.contains("white") ? "white" : "black";
  return squareColor;
}

function getAllPossibleMoves(squaresArray, color) {
  return squaresArray
    .filter((square) => square.pieceColor === color)
    .flatMap((square) => {
      const { pieceColor, pieceType, pieceId } = getPieceAtSquare(
        square.squareId,
        squaresArray
      );
      if (pieceId === "blank") return [];
      let squaresArrayCopy = deepCopyArray(squaresArray);
      const pieceObject = {
        pieceColor: pieceColor,
        pieceType: pieceType,
        pieceId: pieceId,
      };
      let legalSquares = getPossibleMoves(
        square.squareId,
        pieceObject,
        squaresArrayCopy
      );
      legalSquares = isMoveValidAgainstCheck(
        legalSquares,
        square.squareId,
        pieceColor,
        pieceType,
		squaresArrayCopy
      );
      return legalSquares;
    });
}
function showAlert(message) {
  const alert = document.getElementById("alert");
  alert.innerHTML = message;
  alert.style.display = "block";
// ADD THE SOUND TRIGGER HERE
  playVictorySound();
  setTimeout(function () {
    alert.style.display = "none";
  }, 6000);
}

// --- SMART AI IMPLEMENTATION (Minimax + Positional Strategy) ---

// Depth 2 means: AI looks at its move -> Your reply.
// You can change this to 3 for a harder bot, but it will be slower.
let AI_SEARCH_DEPTH = 2; 

// 2. Check if the user has a saved difficulty level in their browser
const savedDifficulty = localStorage.getItem("aiDifficulty");
if (savedDifficulty !== null) {
  AI_SEARCH_DEPTH = parseInt(savedDifficulty);
}

// 3. Create the function to save the new difficulty and restart
function setDifficultyAndReload(depth) {
  // Save the chosen depth (1 = Easy, 2 = Normal, 3 = Hard)
  localStorage.setItem("aiDifficulty", depth);
  
  // Hide the popup if it exists to make the transition smoother
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
  
  // Reload the page to reset the board and apply the new AI depth
  setTimeout(() => {
    window.location.reload();
  }, 150); 
}

function makeAIMove() {
  if (!isWhiteTurn) return; 

  // 1. Get all valid moves
  const possibleMoves = getAllMovesForColor("white", boardSquaresArray);

  if (possibleMoves.length === 0) return; 

  let bestMove = null;
  let bestValue = -Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  // 2. Minimax Root Call
  // We shuffle moves to add variety if multiple moves have the same score
  possibleMoves.sort(() => Math.random() - 0.5);

  for (const move of possibleMoves) {
    // A. Simulate Move
    let simulatedBoard = deepCopyArray(boardSquaresArray);
    
    // We update the internal array only for calculation (no DOM changes yet)
    // Note: We need a simplified update function for simulation to avoid DOM errors
    simulateMoveOnBoard(move, simulatedBoard);

    // B. Call Minimax (Look ahead for White's best response)
    // We pass 'false' because now it's White's turn to minimize Black's score
    let boardValue = minimax(simulatedBoard, AI_SEARCH_DEPTH - 1, false, alpha, beta);

    // C. Undo is handled by discarding 'simulatedBoard' in next loop iteration

    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
    // Alpha-Beta Pruning (Optional optimization at root)
    alpha = Math.max(alpha, bestValue);
  }

  // 3. Execute Best Move
  if (bestMove) {
    performAIMove(bestMove);
  } else {
    // Fallback if minimax fails (rare)
    performAIMove(possibleMoves[0]);
  }
}

// --- THE BRAIN: Minimax Algorithm ---
function minimax(board, depth, isMaximizingPlayer, alpha, beta) {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  const moves = getAllMovesForColor(isMaximizingPlayer ? "white" : "black", board);

  if (moves.length === 0) {
    return evaluateBoard(board); // Game over state
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
      let eval = minimax(simBoard, depth - 1, false, alpha, beta);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break; // Prune
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      let simBoard = deepCopyArray(board);
      simulateMoveOnBoard(move, simBoard);
      let eval = minimax(simBoard, depth - 1, true, alpha, beta);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break; // Prune
    }
    return minEval;
  }
}

// --- HELPER: Simulate Move without DOM ---
function simulateMoveOnBoard(move, board) {
    const fromSq = board.find(sq => sq.squareId === move.from);
    const toSq = board.find(sq => sq.squareId === move.to);
    
    // Handle Capture
    toSq.pieceColor = fromSq.pieceColor;
    toSq.pieceType = fromSq.pieceType;
    toSq.pieceId = fromSq.pieceId; // Keep ID for tracking
    
    // Handle Promotion (Auto-Queen for AI calculation)
    if (toSq.pieceType === 'pawn' && (move.to[1] === '1' || move.to[1] === '8')) {
        toSq.pieceType = 'queen';
    }

    // Clear Origin
    fromSq.pieceColor = "blank";
    fromSq.pieceType = "blank";
    fromSq.pieceId = "blank";
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

    if (square.pieceColor === "white") {
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
  const piece = fromSquare.querySelector(".piece");

  if (!piece) return;

  // 1. Handle Captures (Remove existing piece from DOM)
  const existingPiece = toSquare.querySelector(".piece");
  if (existingPiece) {
    toSquare.removeChild(existingPiece);
  }

  // 2. Move the Piece (DOM)
  toSquare.appendChild(piece);
  
  // 3. Handle Promotion (Auto-promote to Queen for AI)
  const isPawn = piece.classList.contains("pawn");
  const isLastRank = move.to[1] === "1"; // Black promotes on rank 1
  let promotedType = "blank";
  
  if (isPawn && isLastRank) {
     piece.src = "White-Queen2.png"; // Ensure this filename matches your assets
     piece.classList.remove("pawn");
     piece.classList.add("queen");
     promotedType = "queen";
  }

  // 4. Update Game State
  const captured = !!existingPiece;
  const pieceType = piece.classList[1]; // e.g. "pawn", "knight"
  
  // Update the internal array
  updateBoardSquaresArray(move.from, move.to, boardSquaresArray, promotedType === "blank" ? "blank" : promotedType);
  
  // Register the move in history and switch turns
  makeMove(move.from, move.to, pieceType, "white", captured, promotedType);
  
  // 5. Finalize
  playMoveSound();
  highlightMovedPiece(piece);
  
  // IMPORTANT: Switch turn back to White so you can play
  isWhiteTurn = !isWhiteTurn; 
  checkForEndGame();
}
// White starts, and AI is White
if (isWhiteTurn) {
  setTimeout(makeAIMove, 800);
}