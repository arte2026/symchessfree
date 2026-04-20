// touchControls.js

let touchPiece = null;
let touchStartSquareId = null;

export function initTouchControls({ 
  allowMovementRef,
  isWhiteTurnRef,
  getPossibleMoves,
  isMoveValidAgainstCheck,
  boardSquaresArray,
  drop
}) {

  function onTouchStart(e) {
    if (!allowMovementRef.value) return;
    e.preventDefault();

    touchPiece = e.currentTarget;

    const pieceColor = touchPiece.getAttribute("color");

    if (
      (isWhiteTurnRef.value && pieceColor !== "white") ||
      (!isWhiteTurnRef.value && pieceColor !== "black")
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
    const targetElem = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );

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
        },
      },
      preventDefault: () => {},
    };

    drop(event);
  }

  return {
    onTouchStart
  };
}