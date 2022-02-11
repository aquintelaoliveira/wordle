import * as word_repository from './word_repository.js';

// game state to be saved
var solution = '';
var boardState = ["", "", "", "", ""];
var rowIndex = 0;

// on going game state
var currentTileChild = 0;
var currentWordArr = [];

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("new-game-button")
        .addEventListener("click", () => {
            handleNewGame();
        });

    document.getElementById("settings-button")
        .addEventListener("click", () => {
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
    let boardContainerEl = document.getElementById("board-container");
    let w = Math.min(Math.floor(boardContainerEl.clientHeight * (5/6)), 350);
    let h = 6 * Math.floor(w / 5);
    let boardEl = document.getElementById("board");
    boardEl.style.width="".concat(w, "px")
    boardEl.style.height="".concat(h, "px")
}

/**
 * Create row and tiles elements on DOM.
 * @param {void}
 * @return {void}
 */
function createTiles() {
    const gameBoard = document.getElementById("board");
    for (let i = 0; i < 6; i++) {
        let gameRowEl = document.createElement("game-row");
        let rowEl = document.createElement("div");
        rowEl.classList.add("row");
        for (let j = 0; j < 5; j++) {
            let tileEl = document.createElement("div");
            tileEl.classList.add("tile");
            tileEl.setAttribute("data-state", "empty");
            rowEl.appendChild(tileEl);
            gameRowEl.appendChild(rowEl);
        }
        gameBoard.appendChild(gameRowEl);
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
        const currentTileEl = document.querySelectorAll(".row")[rowIndex].childNodes[currentTileChild];
        currentTileEl.textContent = letter;
        currentTileEl.setAttribute("data-state", "tbd");
        animateCSS(currentTileEl, "pulse");
        currentTileChild += 1;
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
        const tileEl = document.querySelectorAll(".row")[rowIndex].childNodes[currentTileChild - 1];
        tileEl.textContent = '';
        tileEl.setAttribute("data-state", "empty");
        currentTileChild -= 1;
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
        handleToast("game", `Sorry, you have no more guesses! The word is ${solution}`, 1000);
        return;
    }

    const currentWord = currentWordArr.join('');

    if(currentWordArr.length !== 5) {
        animateCssIncorrectAttempt();
        handleToast("game", "Not enough letters", 500);
        return;
    }

    if (!word_repository.hasWord(currentWord)) {
        animateCssIncorrectAttempt();
        handleToast("game", "Not in word list", 500);
        return;
    }

    updateRowTilesState(currentWordArr, rowIndex, 250);
    updateKeyboardState(currentWordArr, 1500);

    if (currentWord === solution) {
        animateCssWinGame(2000);
        return;
    }

    boardState[rowIndex++] = currentWord;
    currentTileChild = 0;
    currentWordArr = [];
    saveGameState();

}

/**
 * Evaluate submited letter agains't the solution letter from the same index position.
 * @param {string} letter - Letter to be validated
 * @param {int} index - Letter position in word array
 * @return {string} - "absent"  if there letter doens't exist in solutuion,
 *                    "present" if the letter exists but it's on the wrong position,
 *                    "correct" if the letter exists and it's on the correct position
 */
function evaluate(letter, index) {

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
    let rowEl = document.querySelectorAll(".row")[rowIndex];
    wordArr.forEach((letter, index) => {
        setTimeout(() => {
            const dataState = evaluate(letter, index);
            const tileEl = rowEl.childNodes[index];
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
            const dataState = evaluate(letter, index);
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
    let rowEl = document.querySelectorAll(".row")[rowIndex];
    currentWordArr.forEach((item, index) => {
        const tileEl = rowEl.childNodes[index];
        animateCSS(tileEl, "headShake");
    });
}

/**
 * Animates tiles on win condition.
 * @param {int} interval - Time in milliseconds that function will wait before execution
 * @return {void}
 */
function animateCssWinGame(interval) {
    let rowEl = document.querySelectorAll(".row")[rowIndex];
    setTimeout(() => {
        currentWordArr.forEach((item, index) => {
            setTimeout(() => {
                const tileEl = rowEl.childNodes[index];
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
    return new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        element

        element.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            element.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        element.addEventListener('animationend', handleAnimationEnd, { once: true });
    });
}

/**
 * Creates, displays and then removes toast element DOM.
 * Adds animation name to element class, and once it is done removes it
 * @param {string} - Element type (system or game)
 * @param {string} - Message to be displayed in toast element
 * @param {int} prefix - Time in milliseconds that function will wait before execution
 * @return {void}
 */
function handleToast(type, message, interval) {
    const toasterEl = document.getElementById(`${type}-toaster`);
    if (toasterEl.childNodes.length === 0) {
        const toastEl = document.createElement(`${type}-toast`);
        toastEl.innerText = message;
        toasterEl.appendChild(toastEl);
        setTimeout(() =>{
            animateCSS(toastEl, "fadeOut")
            .then(() => {
                toasterEl.removeChild(toasterEl.lastChild);
            })
        }, interval);
    }
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
    boardState.forEach((row, rowIndex) => {
        let rowArr = row.split('');
        if(rowArr.length === 0) {
            return;
        }
        rowArr.forEach((letter, index) => {
            const tileEl = document.querySelectorAll(".row")[rowIndex].childNodes[index];
            tileEl.textContent = letter;
        });
        updateRowTilesState(rowArr, rowIndex, 0);
        updateKeyboardState(rowArr, 0);
    });
}
