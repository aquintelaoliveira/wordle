import * as word_repository from './word_repository.js';

// game state to be saved
let solution = '';
let boardState = ["", "", "", "", ""];
let rowIndex = 0;

// on going game state
let currentTileId = 1;
let currentWordArr = [];

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("new-game-button")
        .addEventListener("click", () => {
            handleNewGame();
        });

    window.addEventListener("resize", () => {
        handleBoardResize();
    })
    
    createTiles();
    indexKeyboardButtons();

    if(hasGameState()) {
        loadGameState();
    } else {
        solution = word_repository.getRandomWord();
    }

});

/**
 * Resizes tile board so that width will be 5/6 ratio of height.
 * @param {void}
 * @return {void}
 */
function handleBoardResize() {
    var boardContainerEl = document.getElementById("board-container");
    var w = Math.min(Math.floor(boardContainerEl.clientHeight * (5/6)), 350);
    var h = 6 * Math.floor(w / 5);
    var boardEl = document.getElementById("board");
    boardEl.style.width="".concat(w, "px")
    boardEl.style.height="".concat(h, "px")
}

/**
 * Create row and tiles elements on DOM.
 * @param {void}
 * @return {void}
 */
function createTiles() {
    let id = 1;
    const gameBoard = document.getElementById("board");
    for (let i = 0; i < 6; i++) {
        let game_row = document.createElement("game-row");
        let row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 5; j++) {
            let tile = document.createElement("div");
            tile.setAttribute("id", id++);
            tile.classList.add("tile");
            tile.setAttribute("data-state", "empty");
            row.appendChild(tile);
            game_row.appendChild(row);
        }
        gameBoard.appendChild(game_row);
    }
}

/**
 * Sets behavior for every key on keyboard.
 * @param {void}
 * @return {void}
 */
function indexKeyboardButtons() {
    const keys = document.querySelectorAll(".keyboard-row button");
    for (let i = 0; i < keys.length; i++) {
        keys[i].onclick = () => {
            const letter = keys[i].getAttribute("data-key");

            if (letter ==="enter") {
                handleSubmitWord();
                return;
            }

            if (letter ==="del") {
                handleDeleteLetter();
                return;
            }

            handlePressedLetter(letter);
        }
    }
}

/**
 * Sets tile behavior when a letter key is pressed.
 * Updates tile element textContent and data-state atribute.
 * Animates tile element.
 * @param {string} letter - Tile letter.
 * @return {void}
 */
function handlePressedLetter(letter) {
    if (rowIndex < 6 && currentWordArr.length < 5) {
        currentWordArr.push(letter);
        const currentTileEl = document.getElementById(String(currentTileId));
        currentTileEl.textContent = letter;
        currentTileEl.setAttribute("data-state", "tbd");
        animateCSS(currentTileEl, "pulse");
        currentTileId += 1;
    }
}

/**
 * Deletes information from last tile.
 * @param {void}
 * @return {void}
 */
function handleDeleteLetter() {
    if (currentWordArr.length > 0) {
        currentWordArr.pop();
        const tileEl = document.getElementById(String(currentTileId - 1));
        tileEl.textContent = '';
        tileEl.setAttribute("data-state", "empty");
        currentTileId -= 1;
    }
}

/**
 * Sets tile behavior when a letter key is pressed.
 * Updates tile element textContent and data-state atribute.
 * Animates tile element.
 * @param {string} letter - Tile letter.
 * @return {void}
 */
function handleSubmitWord() {

    if (rowIndex === 6) {
        window.alert(`Sorry, you have no more guesses! The word is ${solution}`);
        return;
    }

    const currentWord = currentWordArr.join('');

    if(currentWordArr.length !== 5) {
        animateCssIncorrectAttempt();
        return;
    }

    if (!word_repository.hasWord(currentWord)) {
        animateCssIncorrectAttempt();
        return;
    }

    updateRowTilesState(currentWordArr, rowIndex, 250);
    updateKeyboardState(currentWordArr, 1500);

    if (currentWord === solution) {
        animateCssWinGame(2000);
        return;
    }

    boardState[rowIndex++] = currentWord;
    currentWordArr = [];
    saveGameState();
}

/**
 * Validates submited letter agains't the solution letter from the same index position.
 * @param {string} letter - Letter to be validated
 * @param {int} index - Letter position in word array
 * @return {string} - "absent"  if there letter doens't exist in solutuion,
 *                    "present" if the letter exists but it's on the wrong position,
 *                    "correct" if the letter exists and it's on the correct position
 */
function getDataState(letter, index) {

    const isCorrectLetter = solution.includes(letter);
    if (!isCorrectLetter) {
        return "absent";
    }

    const solutionLetterInThatPosition = solution.charAt(index);
    const isCorrectPosition = letter === solutionLetterInThatPosition;
    if (isCorrectPosition) {
        return "correct";
    }

    return "present";
}

/**
 * Updates row tiles state.
 * Color keyboard keys based on last letter evaluation. 
 * @param {Array} wordArr - Array of letters
 * @param {int} rowIndex - Tile row index to be updated
 * @param {int} interval - Time in milliseconds that function will wait before execution
 * @return {void}
 */
function updateRowTilesState(wordArr, rowIndex, interval) {
    const firstRowTileId = rowIndex * 5 + 1;
    wordArr.forEach((letter, index) => {
        setTimeout(() => {
            const dataState = getDataState(letter, index);
            const tileId = firstRowTileId + index;
            const tileEl = document.getElementById(tileId);
            tileEl.setAttribute("data-state", dataState);
            animateCSS(tileEl, "flipInX");
        }, interval * index);
    });
}

/**
 * Updates keyboard state.
 * Color keyboard keys based on last letter evaluation. 
 * @param {Array} wordArr - Array of letters
 * @param {int} interval - Time in milliseconds that function will wait before execution
 * @return {boolean} True if there is a gameState, False otherwise
 */
function updateKeyboardState(wordArr, interval) {
    setTimeout(() => {
        wordArr.forEach((letter, index) => {
            const dataState = getDataState(letter, index);
            const keyEl = document.querySelector(`[data-key=${letter}]`);
            keyEl.setAttribute("data-state", dataState)
        });
    }, interval);
}

/**
 * Animates tiles on incorrect word submission attempt.
 * @param {void}
 * @return {void}
 */
function animateCssIncorrectAttempt() {
    const firstRowTileId = rowIndex * 5 + 1;
    currentWordArr.forEach((item, index) => {
        const tileId = firstRowTileId + index;
        const tileEl = document.getElementById(tileId);
        animateCSS(tileEl, "headShake");
    });
}

/**
 * Animates tiles on win condition.
 * @param {int} interval - Time in milliseconds that function will wait before execution
 * @return {void}
 */
function animateCssWinGame(interval) {
    const firstRowTileId = rowIndex * 5 + 1;
    setTimeout(() => {
        currentWordArr.forEach((item, index) => {
            setTimeout(() => {
                const tileId = firstRowTileId + index;
                const tileEl = document.getElementById(tileId);
                animateCSS(tileEl, "bounce");
            }, 100 * index);
        });
    }, interval);
}

/**
 * Animates DOM element with css animation from Animate.css code.
 * Adds animation name to element class, and once it is done removes it
 * https://animate.style/
 * @param {element} - DOM element to be animated
 * @param {animation} - animation name
 * @param {string} prefix - animation name prefix
 * @return {void}
 */
const animateCSS = (element, animation, prefix = 'animate__') => {
    // Create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        element

        element.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            element.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        element.addEventListener('animationend', handleAnimationEnd, { once: true });
    });
}

/**
 * Verifies is there is a game state in localStorage.
 * @param {void}
 * @return {boolean} True if there is a gameState, False otherwise
 */
function hasGameState() {
    return JSON.parse(localStorage.getItem("gameState")) !== null;
}

/**
 * Creates a new game by refreshing page, and clean past game state from localStorage.
 * @param {void}
 * @return {void}
 */
function handleNewGame() {
    localStorage.clear();
    document.location.reload(true);
}

/**
 * Saves current game state to localStorage.
 * @param {void}
 * @return {void}
 */
function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify({
        solution: solution,
        boardState: boardState,
        rowIndex: rowIndex,
    }));
}

/**
 * Loads game state from localStorage, and re-builds game ui.
 * @param {void}
 * @return {void}
 */
function loadGameState() {
    let gameState = JSON.parse(localStorage.getItem("gameState"));
    if (gameState) {
        solution = gameState.solution,
        boardState = gameState.boardState,
        rowIndex = gameState.rowIndex
        rebuildUi(boardState);
    }
}

/**
 * Re-builds tiles and keyboard ui using boardState object from localStorage.
 * @param {object} boardState - Array with all submited words.
 * @return {void}
 */
function rebuildUi(boardState) {
    currentTileId = 1;
    boardState.forEach((row, rowIndex) => {
        let rowArr = row.split('');
        if(rowArr.length === 0) {
            return;
        }
        rowArr.forEach((letter, index) => {
            const currentTileEl = document.getElementById(String(currentTileId++));
            currentTileEl.textContent = letter;
        });
        updateRowTilesState(rowArr, rowIndex, 0);
        updateKeyboardState(rowArr, 0);
    });
}
