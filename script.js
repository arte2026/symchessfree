const openBtn = document.getElementById('openPopup');
const closeBtn = document.getElementById('closePopup');
const reloadBtn = document.getElementById('reloadBtn');
const popup = document.getElementById('popup');

const buttonSound = document.getElementById("buttonSound");
const buttonSound1 = document.getElementById("buttonSound1");

openBtn.addEventListener('click', () => {
  popup.style.display = 'flex';
});

closeBtn.addEventListener('click', () => {
  popup.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === popup) {
    popup.style.display = 'none';
  }
});

const classicLocalBtn = document.getElementById('classicLocalBtn');
const timePopup = document.getElementById('timePopup');
const backToMain = document.getElementById('backToMain');

// Only run the code inside if the button is found on this HTML page
if (classicLocalBtn) {
  classicLocalBtn.addEventListener('click', () => {
  popup.style.display = 'none';
  timePopup.style.display = 'flex';
});

}

// Back to main popup
if (backToMain) {
backToMain.addEventListener('click', () => {
  timePopup.style.display = 'none';
  popup.style.display = 'flex';
});
}

const classicLocalBtn2 = document.getElementById('classicLocalBtn2');
const timePopup2 = document.getElementById('timePopup2');
const backToMain2 = document.getElementById('backToMain2');

// Only run the code inside if the button is found on this HTML page
if (classicLocalBtn2) {
  classicLocalBtn2.addEventListener('click', () => {
  popup.style.display = 'none';
  timePopup2.style.display = 'flex';
});

}

// Back to main popup
if (backToMain2) {
backToMain2.addEventListener('click', () => {
  timePopup2.style.display = 'none';
  popup.style.display = 'flex';
});
}

// 1. Store your translations directly in the JS file to bypass Android CORS limits
const gameDictionary = {
  "en": {
  
  "app_version": "♕ SymChess v. 3.0",
  "main_subtitle": "Challenge a Friend or Beat the AI",
  "btn_main": "🕐 Set Clock 🕐",
  "btn_koth": "👑 King of the Hill",
  "btn_chess960": "🎲 Chess960",
  "btn_endgame": "🥊 Endgame Battle",
  "btn_bot_ai": "🤖 Chess Bot AI",
  "blitz_menu_title": "♕ Blitz Chess",
  "blitz_menu_subtitle": "⚔ Two Players on Same Device",
  "btn_5_min": "🕐 5 Minutes",
  "btn_7_min": "🕐 7 Minutes",
  "btn_9_min": "🕐 9 Minutes",
  "koth_title": "👑 King of the Hill",
  "koth_sub": "🚩 The King that Reaches the Center Win",
  "btn_blitz_2": "♕ Blitz Chess",
  "960_sub": "🎰 Random Starting Position",  
  "endgame_sub": "⚔ Set 5 Diferent Endgame Battle Positions",
  "btn_1": "♛ Set #1",
  "btn_2": "♞ Set #2",
  "btn_3": "♝ Set #3",
  "btn_4": "♜ Set #4",
  "btn_5": "♟ Set #5",
  "btn_home": "🏠 Home",  
  "botw_title": "🤖 Chess Bot (W)",
  "botw_sub": "Play as White vs Bot AI",
  "btn_botd": "🤖 Choose Difficulty",
  "btn_bot2": "⇕ Play as Black",
  "btn_bot960": "🎰 Chess960 Bot",
  "btn_easy": "😄 Easy (5m)",
  "btn_normal": "😐 Normal (7m)",
  "btn_hard": "😠 Hard (9m)", 
  "botb_title": "👾 Chess Bot (B)",
  "botb_sub": "Play as Black vs Bot AI",
  "btn_botd2": "👾 Choose Difficulty",
  "btn_bot2b": "⇕ Play as White", 
  "bot960_title": "🎲 Chess960 Bot (W)",
  "bot960_sub": "Play as White vs 960 Bot AI",
  "btn_back": "← Go Back", 
  "bot960b_title": "🎲 Chess960 Bot (B)",
  "bot960b_sub": "Play as Black vs 960 Bot AI",
  "bot_rules": "📄 RULES",
  "rules_title": "📖 Rules of Chess",
  "rules_sub": "🏆 Checkmate: Trap the opponent's King <br>so it cant escape an attack",
  "rules_txt": "♔ King: Moves 1 square in any direction.<br>♕ Queen: Moves any distance in any direction.<br>♖ Rook: Moves any distance straight.<br>♗ Bishop: Moves any distance diagonally.<br>♘ Knight: Moves in an L shape: 2 steps straight,<br>1 step sideways. It can jump over others!<br>♙ Pawn: Moves 1 step forward, or 2 steps on its<br>first move. It captures enemies 1 step diagonally.<br>🏰 Castling: Move your King 2 squares toward a Rook. <br>That Rook then jumps over to stand next to the King.",
  "alert_time_white": "Time! WHITE wins",
    "alert_time_black": "Time! BLACK wins",
    "alert_draw": "Draw",
      "alert_koth":"King of the Hill",
    "alert_white_wins": "White Wins!",
    "alert_black_wins": "Black Wins!",
      "moveh": "Move History",
}
,
  "es": {
  
  "app_version": "♕ SymChess v. 3.0",
  "main_subtitle": "Reta un Amigo o Gana vs la IA",
  "btn_main": "🕐 Ajustar Reloj 🕐",
  "btn_koth": "👑 Rey de la Colina",
  "btn_chess960": "🎲 Ajedrez960",
  "btn_endgame": "🥊 Batalla de Finales",
  "btn_bot_ai": "🤖 Bot Ajedrez IA",
  "blitz_menu_title": "♕ Ajedrez Blitz",
  "blitz_menu_subtitle": "⚔ Dos Jugadores en un Dispositivo",
  "btn_5_min": "🕐 5 Minutos",
  "btn_7_min": "🕐 7 Minutos",
  "btn_9_min": "🕐 9 Minutos",  
  "koth_title": "👑 Rey de la Colina",
  "koth_sub": "🚩 El Rey que Llega al Centro Gana",
  "btn_blitz_2": "♕ Ajedrez Blitz", 
  "960_sub": "🎰 Posicion Inicial Aleatoria", 
  "endgame_title": "🥊 Batalla de Finales",
  "endgame_sub": "⚔ Juega 5 Distintas Posiciones Finales",
  "btn_1": "♛ Posicion #1",
  "btn_2": "♞ Posicion #2",
  "btn_3": "♝ Posicion #3",
  "btn_4": "♜ Posicion #4",
  "btn_5": "♟ Posicion #5",
  "btn_home": "🏠 Inicio", 
  "botw_title": "🤖 Bot de Ajedrez (B)",
  "botw_sub": "Juega Blancas vs la Bot IA",
  "btn_botd": "🤖 Elige Dificultad",
  "btn_bot2": "⇕ Juega Negras",
  "btn_bot960": "🎰 Bot Ajedrez960",
  "btn_easy": "😄 Facil (5m)",
  "btn_normal": "😐 Normal (7m)",
  "btn_hard": "😠 Dificil (9m)", 
  "botb_title": "👾 Bot de Ajedrez (N)",
  "botb_sub": "Juega Negras vs la Bot IA",
  "btn_botd2": "👾 Elige Dificultad",
  "btn_bot2b": "⇕ Juega Blancas",
  "bot960_title": "🎲 Bot de Ajedrez960 (B)",
  "bot960_sub": "Juega Blancas vs la Bot IA 960",
  "btn_back": "← Regresa",
  "bot960b_title": "🎲 Bot de Ajedrez960 (N)",
  "bot960b_sub": "Juega Negras vs la Bot IA 960 ",
  "bot_rules": "📄 REGLAS",
  "rules_title": "📖 Reglas del Ajedrez",
  "rules_sub": "🏆 Jaque mate: Atrapa al Rey del oponente <br>para que no pueda escapar de un ataque.",
  "rules_txt": "♔ Rey: Se mueve 1 casilla en cualquier dirección.<br>♕ Dama: Cualquier distancia en cualquier dirección.<br>♖ Torre: Se mueve cualquier distancia en línea recta.<br>♗ Alfil: Se mueve cualquier distancia en diagonal.<br>♘ Caballo: Se mueve en forma de L: 2 casillas rectas,<br>1 casilla hacia un lado. ¡Puede saltar sobre otros!<br>♙ Peón: Se mueve 1 casilla hacia adelante, o 2 casillas en su<br>primer movimiento. Captura enemigos 1 casilla en diagonal.<br>🏰 Enroque: Mueve tu Rey 2 casillas hacia una Torre.<br>Luego esa Torre salta para colocarse junto al Rey.",
      "alert_time_white": "¡Tiempo! Ganan las BLANCAS",
    "alert_time_black": "¡Tiempo! Ganan las NEGRAS",
    "alert_draw": "Empate",
      "alert_koth":"Rey de la Colina",
    "alert_white_wins": "¡Ganan las Blancas!",
    "alert_black_wins": "¡Ganan las Negras!",
      "moveh": "Movimientos",
}
,
    
    "ru": {
  
  "app_version": "♕ SymChess v. 3.0",
  "main_subtitle": "Бросьте вызов другу или победите ИИ",
  "btn_main": "🕐 Установите часы 🕐",
  "btn_koth": "👑 Царь горы",
  "btn_chess960": "🎲 Шахматный 960",
  "btn_endgame": "🥊 Эндшпиль",
  "btn_bot_ai": "🤖 Шахматный бот ИИ",
  "blitz_menu_title": "♕ Блиц-шахматы",
  "blitz_menu_subtitle": "⚔ Два игрока на одном устройстве",
  "btn_5_min": "🕐 5 минут",
  "btn_7_min": "🕐 7 минут",
  "btn_9_min": "🕐 9 минут",  
  "koth_title": "👑 Царь горы",
  "koth_sub": "⛰ Король, достигший центра, побеждает",
  "btn_blitz_2": "♕ Блиц-шахматы", 
  "960_sub": "🎰 Случайная начальная позиция", 
  "endgame_title": "🥊 Эндшпиль",
  "endgame_sub": "⚔ 5 различных позиций в эндшпиле",
  "btn_1": "♛ Позиция #1",
  "btn_2": "♞ Позиция #2",
  "btn_3": "♝ Позиция #3",
  "btn_4": "♜ Позиция #4",
  "btn_5": "♟ Позиция #5",
  "btn_home": "🏠 Домашняя ", 
  "botw_title": "🤖 Шахматный бот белые",
  "botw_sub": "Играть белыми против бота ИИ",
  "btn_botd": "🤖 Выберите сложность",
  "btn_bot2": "⇕ Играйте за черных",
  "btn_bot960": "🎰 Бот Шахматный 960",
  "btn_easy": "😄 Легкий (5m)",
  "btn_normal": "😐 Нормальный (7m)",
  "btn_hard": "😠 Сложный (9m)", 
  "botb_title": "👾 Шахматный бот Черные",
  "botb_sub": "Играйте за черных против бота ИИ",
  "btn_botd2": "👾 Выберите сложность",
  "btn_bot2b": "⇕ Играйте за белых",
  "bot960_title": "🎲 Бот Шахматный 960 белые",
  "bot960_sub": "Играйте за белых против бота ИИ 960",
  "btn_back": "← Назад",
  "bot960b_title": "🎲 Бот Шахматный 960 Черные",
  "bot960b_sub": "Играть за черных против ИИ-бота 960",
  "bot_rules": "📄 правила",
  "rules_title": "📖 Правила шахмат",
  "rules_sub": "🏆 Мат: Заманить короля противника в ловушку, <br>чтобы он не смог избежать атаки.",
  "rules_txt": "♔ Король: Перемещается на 1 клетку в любом направлении.<br>♕ Ферзь: Перемещается на любое расстояние в любом направлении.<br>♖ Ладья: Перемещается на любое расстояние по прямой.<br>♗ Слон: Перемещается на любое расстояние по диагонали.<br>♘ Конь: Перемещается на 2 шага по прямой, на 1 шаг <br>в сторону. Может перепрыгивать через других!<br>♙ Пешка: Перемещается на 1 шаг вперед или на 2 шага при первом ходе.<br> Захватывает врагов на 1 шаг по диагонали.<br>🏰 Рокировка: Переместите своего короля на 2 клетки к ладье. <br>Затем ладья перепрыгивает и встает рядом с королем.",
      "alert_time_white": "Время! Побеждают БЕЛЫЕ",
"alert_time_black": "Время! Побеждают ЧЁРНЫЕ",
"alert_draw": "Ничья",
      "alert_koth":"Царь горы",
"alert_white_wins": "Побеждают Белые!",
"alert_black_wins": "Побеждают Чёрные!",
        "moveh": "Движения",
}
,


 "pt": {

"app_version": "♕ SymChess v. 2.9",
"main_subtitle": "Desafie um amigo ou vença a IA",
"btn_main": "🕐 Definir Relógio 🕐",
"btn_koth": "👑 Rei da Colina",
"btn_chess960": "🎲 Xadrez 960",
"btn_endgame": "🥊 Batalha dos Finais",
"btn_bot_ai": "🤖 Bot de Xadrez com IA",
"blitz_menu_title": "♕ Xadrez Blitz",
"blitz_menu_subtitle": "⚔ Dois Jogadores em um Dispositivo",
"btn_5_min": "🕐 5 Minutos",
"btn_7_min": "🕐 7 Minutos",
"btn_9_min": "🕐 9 Minutos",
"koth_title": "👑 Rei da Colina",
"koth_sub": "🚩 Rei chega primeiro ao centro e vence",
"btn_blitz_2": "♕ Xadrez Blitz",
"960_sub": "🎰 Posição Inicial Aleatória",
"endgame_title": "🥊 Batalha dos Finais",
"endgame_sub": "⚔ Jogar 5 Posições Finais Diferentes",
"btn_1": "♛ Posição #1",
"btn_2": "♞ Posição #2",
"btn_3": "♝ Posição #3",
"btn_4": "♜ Posição #4",
"btn_5": "♟ Posição #5",
"btn_home": "🏠 Início",
"botw_title": "🤖 Bot de Xadrez (B)",
"botw_sub": "Jogar de Brancas contra o Bot de IA",
"btn_botd": "🤖 Escolher Dificuldade",
"btn_bot2": "⇕ Jogar de Pretas",
"btn_bot960": "🎰 Bot de Xadrez 960",
"btn_easy": "😄 Fácil (5 min)",
"btn_normal": "😐 Normal (7 min)",
"btn_hard": "😠 Difícil (9 min)",
"botb_title": "👾 Bot de Xadrez (N)",
"botb_sub": "Jogar de Pretas contra o Bot de IA",
"btn_botd2": "👾 Escolha a dificuldade",
"btn_bot2b": "⇕ Jogar com as brancas",
"bot960_title": "🎲 Bot Chess960 (B)",
"bot960_sub": "Jogar com as brancas contra o Bot de IA 960",
"btn_back": "← Voltar",
"bot960b_title": "🎲 Bot Chess960 (N)",
"bot960b_sub": "Jogar com as pretas contra o Bot de IA 960",
"bot_rules": "📄 REGRAS",
"rules_title": "📖 Regras do Xadrez",
  "rules_sub": "🏆 Xeque-mate: Encurrala o Rei do oponente <br>para que ele não possa escapar de um ataque.",
  "rules_txt": "♔ Rei: Move-se 1 casa em qualquer direção.<br>♕ Rainha: Move-se qualquer distância em qualquer direção.<br>♖ Torre: Move-se qualquer distância em linha reta.<br>♗ Bispo: Move-se qualquer distância na diagonal.<br>♘ Cavalo: Move-se em forma de L: 2 casas em linha reta,<br>1 casa para o lado. Pode pular sobre outros!<br>♙ Peão: Move-se 1 casa para frente ou 2 casas em seu<br>primeiro movimento. Captura inimigos 1 casa na diagonal.<br>🏰 Roque: Mova seu Rei 2 casas em direção a uma Torre. <br>Aquela torre então salta para ficar ao lado do rei.",
     "alert_time_white": "Tempo! As BRANCAS ganham",
"alert_time_black": "Tempo! As PRETAS ganham",
"alert_draw": "Empate",
     "alert_koth":"Rei da Colina",
"alert_white_wins": "As Brancas ganham!",
"alert_black_wins": "As Pretas ganham!",
     "moveh": "Movimentos",
}
};

// 2. Detect the user's device language
function getDeviceLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.toLowerCase().startsWith('es')) {
        return 'es';
    }
    return 'en';
}

// 3. Load the language from the variable instead of using fetch()
function loadLanguage(langCode) {
    try {
        localStorage.setItem('symchess_language', langCode);

        // Pull the text from our dictionary variable above
        const translations = gameDictionary[langCode];
        
        if (!translations) {
            console.error("Language not found in dictionary");
            return;
        }

        const elementsToTranslate = document.querySelectorAll('[data-i18n]');

        elementsToTranslate.forEach(element => {
            const translationKey = element.getAttribute('data-i18n');
            if (translations[translationKey]) {
                element.innerHTML = translations[translationKey];
            }
        });
        
        document.documentElement.lang = langCode;

    } catch (error) {
        console.error("Error loading language:", error);
    }
}

// 4. Initialize the language when any HTML page loads
function initializeLanguage() {
    let savedLanguage = localStorage.getItem('symchess_language');
    if (!savedLanguage) {
        savedLanguage = getDeviceLanguage();
    }
    loadLanguage(savedLanguage);
}

// Run the setup immediately
initializeLanguage();

// 5. Function for the manual language toggle buttons
function changeLanguage(langCode) {
    localStorage.setItem('symchess_language', langCode);
    loadLanguage(langCode);
}
// Function to grab a specific translation for dynamic alerts
function getTranslation(key) {
    // Check current language, default to English if something goes wrong
    const currentLang = localStorage.getItem('symchess_language') || 'en';
    
    // Return the translated text, or return the key itself if missing
    if (gameDictionary[currentLang] && gameDictionary[currentLang][key]) {
        return gameDictionary[currentLang][key];
    } else {
        return key; 
    }
}

function playButtonSound1() {
  if (!buttonSound1) return;
  buttonSound1.currentTime = 0; // Reset to start for rapid clicks
  buttonSound1.play().catch(() => {
    // Standard catch for browsers that block sound without interaction
  });
}

function playButtonSound(url) {
  
  
  if (buttonSound) {
    buttonSound.currentTime = 0;
    // We use a Promise to ensure the sound starts before we leave the page
    buttonSound.play().catch(e => console.log("Audio blocked:", e));
  }

  // Delay the navigation by 150ms (enough to hear the "click" start)
  setTimeout(() => {
    window.location.href = url;
  }, 150); 
}

if ('serviceWorker' in navigator) {
navigator.serviceWorker.register('./service-worker.js')
.then((registration) => {
console.log('Service worker registration succeeded:', registration);
})
.catch((error) => {
console.error('Service worker registration failed:', error);
});
} else {
console.error('Service workers are not supported.');
}