/**
 * chess960.js
 * Logic to generate and render a Fisher Random (Chess960) board.
 */

function generate960Position() {
  // 1. Create an array of 8 empty slots
  let placement = new Array(8).fill(null);

  // 2. Place Bishops on opposite colors
  // Board indices 0, 2, 4, 6 are one color (e.g., black squares on rank 1 depending on layout)
  // Board indices 1, 3, 5, 7 are the other.
  // Note: visual board color depends on the DOM, but logical indices ensure opposite parity.
  
  let bishop1Pos = Math.floor(Math.random() * 4) * 2; // 0, 2, 4, 6
  let bishop2Pos = Math.floor(Math.random() * 4) * 2 + 1; // 1, 3, 5, 7
  
  placement[bishop1Pos] = 'bishop';
  placement[bishop2Pos] = 'bishop';

  // 3. Place King and Rooks
  // The King must be between the two Rooks.
  // We find the remaining empty slots to place these three.
  let emptySlots = [];
  for (let i = 0; i < 8; i++) {
    if (placement[i] === null) emptySlots.push(i);
  }

  // Pick 3 random slots from the empty ones
  // We strictly need the King in the middle index of the sorted 3 slots.
  let randomIndices = [];
  while (randomIndices.length < 3) {
    let r = Math.floor(Math.random() * emptySlots.length);
    if (!randomIndices.includes(r)) randomIndices.push(r);
  }
  
  // Sort the chosen indices from the emptySlots array to determine Left, Middle, Right
  let chosenSlots = [
      emptySlots[randomIndices[0]], 
      emptySlots[randomIndices[1]], 
      emptySlots[randomIndices[2]]
  ].sort((a, b) => a - b);

  placement[chosenSlots[0]] = 'rook';
  placement[chosenSlots[1]] = 'king'; // King goes in the middle
  placement[chosenSlots[2]] = 'rook';

  // 4. Place Queen and Knights in remaining slots
  let remainingPieces = ['queen', 'knight', 'knight'];
  for (let i = 0; i < 8; i++) {
    if (placement[i] === null) {
      placement[i] = remainingPieces.pop();
    }
  }

  return placement;
}

function initChess960() {
	
	// ✅ FULL RESET
  moves = [];
  positionArray = [];
  enPassantSquare = "blank";
  allowMovement = true;
  isWhiteTurn = true;
	
  const pieceLayout = generate960Position();
  
  // Mapping files 'a' through 'h' to indices 0-7
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // Clear existing pieces on Rank 1 (White) and Rank 8 (Black)
  // and insert new ones.
  files.forEach((file, index) => {
    const pieceName = pieceLayout[index];
    
    // Setup White (Rank 1)
    const whiteSquareId = `${file}1`;
    updateSquareDOM(whiteSquareId, pieceName, 'white');

    // Setup Black (Rank 8) - Mirroring White's layout
    const blackSquareId = `${file}8`;
    updateSquareDOM(blackSquareId, pieceName, 'black');
  });

  // Re-initialize game state
  // We must re-run setupPieces to attach event listeners to the new elements
  setupPieces();
  
  // Update the internal board array to match the visual board
  boardSquaresArray = []; // Clear old state
  fillBoardSquaresArray(); // Re-scan DOM to build state
  
  console.log("Chess 960 Position Loaded:", pieceLayout);
}

function updateSquareDOM(squareId, pieceType, color) {
  const square = document.getElementById(squareId);
  // Remove existing piece if any
  while (square.firstChild) {
      // Keep coordinates if they exist (the numbers/letters on the squares)
      if (square.firstChild.classList && square.firstChild.classList.contains('coordinate')) {
          break; // Don't delete coordinates, but usually pieces are siblings.
          // In your HTML, coordinates are inside the square div. 
          // We should safely remove only elements with class "piece".
      }
      square.removeChild(square.firstChild);
  }
  
  // Remove specifically "piece" elements to be safe (preserve coordinates)
  const existingPiece = square.querySelector('.piece');
  if (existingPiece) square.removeChild(existingPiece);

  // Create new piece structure
  // <div class="piece [type]" color="[color]"><img ...></div>
  const pieceDiv = document.createElement('div');
  pieceDiv.classList.add('piece', pieceType);
  pieceDiv.setAttribute('color', color);
  
  // Construct Image Filename: e.g., "White-Rook.png" or "Black-Queen.png"
  // Note: Your file naming convention varies slightly (e.g. "white-pawn.png" vs "White-Rook.png")
  // We need to match your existing naming convention carefully.
  let imgName = "";
  let cCap = color.charAt(0).toUpperCase() + color.slice(1); // "White" or "Black"
  let pCap = pieceType.charAt(0).toUpperCase() + pieceType.slice(1); // "Rook", "Knight"
  
  // Handle case sensitivity based on your files
  if (pieceType === 'pawn' && color === 'white') imgName = "White-Pawn.png";
  else if (pieceType === 'pawn' && color === 'black') imgName = "Black-Pawn.png"; // Your HTML has "Black-Pawn.png"
  else imgName = `${cCap}-${pCap}.png`; 

  const img = document.createElement('img');
  img.src = imgName;
  img.alt = pieceType;
  
  pieceDiv.appendChild(img);
  square.appendChild(pieceDiv);
}

window.addEventListener('load', initChess960);