import * as word_repository from './word_repository.js';

// game status
const GAME_STATUS = Object.freeze({
    IN_PROGRESS: "IN_PROGRESS",
    WIN: "WIN",
    LOST: "LOST",
});

// win game extol
const extol = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"];

// game state to be saved
var gameStatus = GAME_STATUS.IN_PROGRESS;
var solution = "";
var boardState = ["", "", "", "", ""];
var evaluations = new Array(5).fill(null);
var rowIndex = 0;

// on going game state
var currentTileChild = 0;
var currentWordArr = [];

document.addEventListener('keydown', (event) => {
    handlePressedLetter(event.key);
});

document.addEventListener("DOMContentLoaded", () => {

    createBoard();
    indexVirtualKeyboardButtons();

    window.addEventListener("resize", () => {
        handleBoardResize();
    })

    document.getElementById("new-game-button")
        .addEventListener("click", () => {
            handleNewGame();
        });

    document.getElementById("statistics-button")
        .addEventListener('click', async () => {
            if (gameStatus === GAME_STATUS.WIN) {
                handleShare();
            }
        });

    document.getElementById("settings-button")
        .addEventListener('click', () => {
        });

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
    const boardContainerEl = document.getElementById("board-container");
    const w = Math.min(Math.floor(boardContainerEl.clientHeight * (5/6)), 350);
    const h = 6 * Math.floor(w/5);
    const boardEl = document.getElementById("board");
    boardEl.style.width="".concat(w, "px");
    boardEl.style.height="".concat(h, "px");
}

/**
 * Create row and tiles elements on DOM.
 * Resizes tile board.
 * @param {void}
 * @return {void}
 */
function createBoard() {
    const boardContainerEl = document.getElementById("board-container");
    const boardEl = document.createElement("div");
    boardEl.setAttribute("id", "board");
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
        boardEl.appendChild(gameRowEl);
    }
    boardContainerEl.appendChild(boardEl);
    handleBoardResize();
}

/**
 * Sets behavior for every key on virtual keyboard.
 * @param {void}
 * @return {void}
 */
function indexVirtualKeyboardButtons() {
    const keysEl = document.querySelectorAll(".keyboard-row button");
    for (let i = 0; i < keysEl.length; i++) {
        keysEl[i].onclick = () => {
            const letter = keysEl[i].getAttribute("data-key");
            handlePressedLetter(letter);
        }
    }
}

/**
 * Handles pressed letter action.
 * @param {string} letter - Pressed letter key element
 * @return {void}
 */
 function handlePressedLetter(letter) {

        if (letter ==="Enter") {
            handleSubmitWord();
            return;
        }

        if (letter ==="Backspace") {
            handleDeleteLetter();
            return;
        }

        setTileBehavior(letter);
}

/**
 * Sets tile behavior when a keyboard key is pressed.
 * Updates tile element textContent and data-state atribute.
 * Animates tile element.
 * @param {string} letter - Tile letter
 * @return {void}
 */
function setTileBehavior(letter) {
    if (gameStatus === GAME_STATUS.IN_PROGRESS && currentWordArr.length < 5) {
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
 * @param {string} letter - Tile letter
 * @return {void}
 */
function handleSubmitWord() {

    if(gameStatus === GAME_STATUS.WIN) {
        return;
    }

    if (gameStatus === GAME_STATUS.LOST) {
        handleToast("game", `Sorry, you have no more guesses! The word was: ${solution.toUpperCase()}`, 2000);
        return;
    }

    if(currentWordArr.length !== 5) {
        animateCssIncorrectAttempt(rowIndex)
            .then(() => handleToast("game", "Not enough letters", 250));
        return;
    }

    const currentWord = currentWordArr.join('');

    if (!word_repository.hasWord(currentWord)) {
        animateCssIncorrectAttempt(rowIndex)
            .then(() => handleToast("game", "Not in word list", 250));
        return;
    }

    const wordEvaluation = evaluate(currentWordArr);
    updateRowState(wordEvaluation, rowIndex, 250);
    updateKeyboardState(currentWordArr, wordEvaluation, 1500);

    if (currentWord === solution) {
        animateCssWinGame(rowIndex, 2000)
            .then(() => handleToast("game", extol[rowIndex], 500));
        gameStatus = GAME_STATUS.WIN;
    }

    if (rowIndex === 6) {
        gameStatus = GAME_STATUS.LOST;
    }

    boardState[rowIndex] = currentWord;
    evaluations[rowIndex] = wordEvaluation;
    currentTileChild = 0;
    currentWordArr = [];
    rowIndex = gameStatus === GAME_STATUS.IN_PROGRESS ? rowIndex + 1 : rowIndex;

    saveGameState();
}

/**
 * Evaluate submited word letters agains't the solution letters from the same index position.
 * @param {string} letter - Letter to be validated
 * @param {int} index - Letter position in word array
 * @return {Array} - An array of strings with the word letters evaluation:
 *                   "absent"  if there letter doens't exist in solutuion,
 *                   "present" if the letter exists but it's on the wrong position,
 *                   "correct" if the letter exists and it's on the correct position
 */
function evaluate(wordArr) {
    let wordEvaluation = new Array(5).fill("absent");
    let wasCompared = new Array(5).fill(false);

    // first validation: correct letter positions
    wordArr.forEach((letter, index) => {
        const isCorrectPosition = letter === solution.charAt(index);
        if (isCorrectPosition) {
            wasCompared[index] = true;
            wordEvaluation[index] = "correct";
            return;
        }
    });

    // secondond validation: present letter positions
    wordArr.forEach((letter, index) => {
        if (wordEvaluation[index] === 'correct') {
            return;
        }
        let letterIndexInSolution = solution.indexOf(letter);
        while (letterIndexInSolution !== -1) {

            if (!wasCompared[letterIndexInSolution]) {
                wasCompared[letterIndexInSolution] = true;
                wordEvaluation[index] = "present";
                return;
            }
            letterIndexInSolution = solution.indexOf(letter, letterIndexInSolution + 1);
        }
    });

    return wordEvaluation;
}

/**
 * Updates row tiles state.
 * Color keyboard keys based on last letter evaluation. 
 * @param {Array} rowEvaluation - Array with word letters evaluation
 * @param {int} rowIndex - Tile row index to be updated
 * @param {int} interval - Time in milliseconds that function will wait before execution
 * @return {void}
 */
function updateRowState(rowEvaluation, rowIndex, interval) {
    let rowEl = document.querySelectorAll(".row")[rowIndex];
    rowEvaluation.forEach((evaluation, index) => {
        setTimeout(() => {
            const tileEl = rowEl.childNodes[index];
            tileEl.setAttribute("data-state", evaluation);
            animateCSS(tileEl, "flipInX");
        }, interval * index);
    });
}

/**
 * Updates keyboard state.
 * Color keyboard keys based on last letter evaluation. 
 * @param {Array} wordArr - Array with word letters
 * @param {Array} rowEvaluation - Array with word letters evaluation
 * @param {int} interval - Time in milliseconds that function will wait before execution
 * @return {boolean} True if there is a gameState, False otherwise
 */
function updateKeyboardState(wordArr, rowEvaluation, interval) {
    setTimeout(() => {
        wordArr.forEach((letter, index) => {
            const keyEl = document.querySelector(`[data-key=${letter}]`);
            const keyElState = keyEl.getAttribute("data-state");
            switch (rowEvaluation[index]) {
                case "absent":
                    if (keyElState === null) {
                        keyEl.setAttribute("data-state", "absent");
                    }
                    break;
                case "present":
                    if (keyElState === null || keyElState === "absent") {
                        keyEl.setAttribute("data-state", "present");
                    }
                    break;
                case "correct":
                    if (keyElState !== "correct") {
                        keyEl.setAttribute("data-state", "correct");
                    }
                default:
                    keyEl.setAttribute("data-state", rowEvaluation[index])
              }
        });
    }, interval);
}

/**
 * Animates row on incorrect word submission attempt.
 * @param {int} rowIndex - Index of row to animate
 * @return {void}
 */
function animateCssIncorrectAttempt(rowIndex) {
    return new Promise((resolve, reject) => {
        const rowEl = document.querySelectorAll(".row")[rowIndex];
        animateCSS(rowEl, "headShake")
            .then(() => resolve())
    });
}

/**
 * Animates row tiles on win condition.
 * @param {int} rowIndex - Index of row to animate
 * @param {int} interval - Time in milliseconds that function will wait before execution
 * @return {void}
 */
function animateCssWinGame(rowIndex, interval) {
    return new Promise((resolve, reject) => {
        const rowEl = document.querySelectorAll(".row")[rowIndex];
        setTimeout(() => resolve(
            rowEl.childNodes.forEach((item, index) => {
                setTimeout(() => {
                    const tileEl = rowEl.childNodes[index];
                    animateCSS(tileEl, "bounce");
                }, 100 * index);
            })
        ), interval)
    });
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
 * @param {string} - Element type (e.g. game)
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
 * Saves current game state to localStorage.
 * @param {void}
 * @return {void}
 */
function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify({
        gameStatus: gameStatus,
        solution: solution,
        boardState: boardState,
        evaluations: evaluations,
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
        gameStatus = gameState.gameStatus,
        solution = gameState.solution,
        boardState = gameState.boardState,
        evaluations = gameState.evaluations,
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
        let wordArr = row.split("");
        if(wordArr.length === 0) {
            return;
        }
        wordArr.forEach((letter, index) => {
            const tileEl = document.querySelectorAll(".row")[rowIndex].childNodes[index];
            tileEl.textContent = letter;
        });
        updateRowState(evaluations[rowIndex], rowIndex, 0);
        updateKeyboardState(wordArr, evaluations[rowIndex], 0);
    });
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
 * Share game result.
 * @param {void}
 * @return {void}
 */
async function handleShare() {
    const data = {
        title: "Wordle Clone",
        text: "",
        url: "https://aquintelaoliveira@github.io/wordle/",
    }

    evaluations.forEach(word => {
        if (word) {
            word.forEach(evaluation => {
                switch (evaluation) {
                    case "absent":
                        data.text += "⬛";
                        break;
                    case "present":
                        data.text += "🟨";
                        break;
                    case "correct":
                        data.text += "🟩";
                        break;
                    }
            });
            data.text += "\n"
        }
    });

    try {
        await navigator.share(data);
    } catch(err) {
        console.log(err);
    }
}
