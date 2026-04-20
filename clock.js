// clock.js

let whiteTime;
let blackTime;
let increment; 
let clockInterval = null;
let hasGameStarted = false; // Add this flag
function startGame(minutes, incSeconds) {
	
	localStorage.setItem("chessMinutes", minutes);
    localStorage.setItem("chessIncrement", incSeconds);
    localStorage.setItem("hideMenuOnLoad", "true");
  // 1. Ocultar el popup
  document.getElementById("timePopup").style.display = "none";
  
  
  // Delay the navigation by 150ms (enough to hear the "click" start)
  setTimeout(() => {
    window.location.reload();
  }, 150); 
  

  // 4. Initialize the clocks with the chosen time
  initClock(minutes, incSeconds);
  
}

// 2. Lógica que se ejecuta automáticamente cuando la página carga
window.onload = function() {
  // Intentamos recuperar los tiempos guardados
  let savedMinutes = localStorage.getItem("chessMinutes");
  let savedIncrement = localStorage.getItem("chessIncrement");

  // Si hay tiempos guardados, los usamos
  if (savedMinutes !== null && savedIncrement !== null) {
    // Convertimos los textos guardados de vuelta a números
    initClock(parseInt(savedMinutes), parseInt(savedIncrement));
  } else {
    // Si no hay nada guardado (ej. la primera vez que se abre la app),
    // ponemos un tiempo por defecto, por ejemplo 9 minutos.
    initClock(5, 2); 
  }
  // NUEVO: Revisamos si existe la nota para ocultar el menú
  if (localStorage.getItem("hideMenuOnLoad") === "true") {
    const popup = document.getElementById("popup");
    if (popup) {
      popup.style.display = "none"; // Ocultamos el menú
    }
    
    // MUY IMPORTANTE: Borramos la nota para que no se quede oculta para siempre
    localStorage.removeItem("hideMenuOnLoad"); 
  }
  // Nos aseguramos de que el juego esté listo para empezar
  allowMovement = true;
  isWhiteTurn = true;
};

// Función para configurar el tiempo desde cada HTML
function initClock(minutes, incSeconds) {
  whiteTime = minutes * 60;
  blackTime = minutes * 60;
  increment = incSeconds;
  updateClocks(); // Muestra el tiempo en pantalla de inmediato
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateClocks() {
  document.getElementById("white-clock").textContent = formatTime(whiteTime);
  document.getElementById("black-clock").textContent = formatTime(blackTime);
}

function applyIncrement() {
  // Prevent adding time if the game has already ended
  if (!allowMovement) return; 

  if (isWhiteTurn) {
    // White just moved, so give White increment
    whiteTime += increment;
  } else {
    // Black just moved
    blackTime += increment;
  }

  updateClocks();
}

function startClock() {
  // Prevent the clock from restarting if the game is over
  if (!allowMovement || !hasGameStarted) return;

  if (clockInterval) clearInterval(clockInterval);

  document
    .getElementById("white-clock")
    .classList.toggle("active", isWhiteTurn);
  document
    .getElementById("black-clock")
    .classList.toggle("active", !isWhiteTurn);

  clockInterval = setInterval(() => {
    if (isWhiteTurn) {
      whiteTime--;
      if (whiteTime <= 0) endGameOnTime("black");
    } else {
      blackTime--;
      if (blackTime <= 0) endGameOnTime("white");
    }
    updateClocks();
  }, 1000);
}
let isPaused = false;

function togglePause() {
  // Prevent pausing if the game has already ended (allowMovement is false for other reasons)
  if (!allowMovement && !isPaused) return; 

  const pauseBtn = document.getElementById("pause-btn");
  
  if (!isPaused) {
    // --- PAUSING ---
    isPaused = true;
    allowMovement = false; // Stops pieces from being moved in main.js
    
    if (clockInterval) {
      clearInterval(clockInterval); // Stops the countdown
    }
    
    pauseBtn.textContent = ">";
    
    // Visually remove the active highlight from both clocks
    document.getElementById("white-clock").classList.remove("active");
    document.getElementById("black-clock").classList.remove("active");
  } else {
    // --- RESUMING ---
    isPaused = false;
    allowMovement = true; // Re-enables piece movement
    pauseBtn.textContent = "II";
    
    // Resume the clock for the current player
    startClock(); 
  }
}
function endGameOnTime(winner) {
  clearInterval(clockInterval);
  allowMovement = false;

  // Check who won and grab the correct translation
  if (winner === "white") {
    showAlert(getTranslation("alert_time_white"));
  } else {
    showAlert(getTranslation("alert_time_black"));
  }
}