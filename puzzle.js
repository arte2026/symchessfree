/*
 * puzzle.js - "Mate in 1" mode.
 * Glue between the procedural generator (generate_mate1.js -> window.Mate1) and the SymChess engine (main.js).
 *
 * Load order on the page:  main.js, script.js, mate1-i18n.js, generate_mate1.js, puzzle.js
 *
 * What it does
 *   - "Generate Position" asks Mate1.generate() for a puzzle and puts its FEN on the board.
 *   - The player moves normally (drag / touch). The first move is judged: the one mating move = solved,
 *     anything else = "try again" and the same position is restored.
 *   - Engine tweaks (the engine in main.js is otherwise untouched):
 *       kingHasMoved()   -> always true, so no phantom castling is offered in custom positions
 *       checkForEndGame  -> replaced by the puzzle check
 */
(function () {
  'use strict';

  var IMG_SUFFIX = '';    // piece images: '' -> White-Rook.png   |   '3' -> White-Rook3.png
  var TYPE = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' };
  var STORE = 'symchess_mate1';

  var puzzle = null;
  var filter = 'any';
  var solved = 0
  var resetTimer = null;

  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    solved = saved.solved | 0;
    if (saved.filter) filter = saved.filter;
  } catch (e) { /* storage unavailable: counters just won't persist */ }
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify({ solved: solved, filter: filter })); } catch (e) {}
  }

  function T(key) { return typeof getTranslation === 'function' ? getTranslation(key) : key; }
  function $(id) { return document.getElementById(id); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ------------------------------------------------------------------ engine tweaks
  window.kingHasMoved = function () { return true; };

  window.checkForEndGame = function () {
    if (!puzzle || puzzle.done || puzzle.resetting) return;
    var mv = moves[moves.length - 1];
    if (mv && mv.from === puzzle.solution.from && mv.to === puzzle.solution.to) onSolved();
    else onWrong();
  };

  // ------------------------------------------------------------------ UI helpers
  function setStatus(html, cls) {
    var el = $('puzzle-status');
    el.innerHTML = html;
    el.className = cls || '';
  }
  function updateCounters() {
    $('white-clock').textContent = '✔ ' + solved;
   
  }
 
  function patternName(p) {
    var key = 'pat_' + p.patternId.replace(/-/g, '_');
    var name = T(key);
    return name === key ? p.pattern : name;
  }
  function markFilter() {
    document.querySelectorAll('.filter-btn').forEach(function (b) {
      b.classList.toggle('filter-active', b.getAttribute('data-filter') === filter);
    });
  }

  // ------------------------------------------------------------------ board loading
  function makePiece(type, color) {
    var div = document.createElement('div');
    div.className = 'piece ' + type;
    div.setAttribute('color', color);
    var img = document.createElement('img');
    img.src = cap(color) + '-' + cap(type) + IMG_SUFFIX + '2.png';
    img.alt = cap(type);
    div.appendChild(img);
    return div;
  }

  function loadPosition(fen) {
    var board = document.querySelector('.chessBoard');
    var squares = board.getElementsByClassName('square');

    // wipe the board (coordinates are not pieces, they stay)
    board.querySelectorAll('.piece, .promotionOption').forEach(function (el) { el.remove(); });
    for (var s = 0; s < squares.length; s++) { squares[s].style.opacity = ''; squares[s].style.backgroundColor = ''; }

    // place the new pieces
    var rows = fen.split(' ')[0].split('/');
    for (var r = 0; r < 8; r++) {
      var file = 0;
      for (var c = 0; c < rows[r].length; c++) {
        var ch = rows[r].charAt(c);
        if (ch >= '1' && ch <= '8') { file += +ch; continue; }
        var color = ch === ch.toUpperCase() ? 'white' : 'black';
        squares[r * 8 + file].appendChild(makePiece(TYPE[ch.toUpperCase()], color));
        file++;
      }
    }

    // reset the engine's state (globals declared in main.js) and rebuild its views of the board
    boardSquaresArray = [];
    positionArray = [];
    moves = [];
    moveHistory = [];
    enPassantSquare = 'blank';
    isWhiteTurn = true;                 // every puzzle is White to move
    allowMovement = true;
    touchPiece = null;
    touchStartSquareId = null;
    setupBoardSquares();
    setupPieces();
    fillBoardSquaresArray();
    clearLastMovedPiece();
    renderMoveHistory();
   
    $('alert').style.display = 'none';
  }

  // ------------------------------------------------------------------ puzzle flow
  function newPuzzle() {
    clearTimeout(resetTimer);
    var p = window.Mate1 && Mate1.generate({ piece: filter });
    if (!p) { setStatus(T('mate1_error'), 'bad'); return; }
    puzzle = {
      fen: p.fen, solution: p.solution, patternId: p.patternId, pattern: p.pattern,
      done: false, resetting: false
    };
   
    loadPosition(p.fen);
    setStatus(T('mate1_find'));
    $('popup').style.display = 'none';
  }

  function onSolved() {
    puzzle.done = true;
    allowMovement = false;
    solved++;
    persist(); updateCounters();
    setStatus(T('mate1_ok') + '<br>' + puzzle.solution.san + '<br><small>' + patternName(puzzle) + '</small>', 'ok');
    showAlert(getTranslation('alert_white_wins'));
  }

  function onWrong() {
    puzzle.resetting = true;
    allowMovement = false;
    
    updateCounters();
    setStatus(T('mate1_no'), 'bad');
    resetTimer = setTimeout(function () {
      loadPosition(puzzle.fen);
      puzzle.resetting = false;
      setStatus(T('mate1_find'));
    }, 1200);
  }

  // ------------------------------------------------------------------ wiring
 
  $('menuGenerate').addEventListener('click', function () { playButtonSound1(); newPuzzle(); });
 
  document.querySelectorAll('.filter-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.getAttribute('data-filter');
      persist(); markFilter();
      newPuzzle();
    });
  });


  markFilter();
  updateCounters();
  newPuzzle();
})();
