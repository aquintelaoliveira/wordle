let solution = '';
let boardState = ["", "", "", "", ""];
let evaluations = new Array(5).fill(null);
let rowIndex = 0;

let currentTileId = 1;
let currentWordArr = [];

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("new-game-button")
        .addEventListener("click", () => {
            handleNewGame();
        });
    
    createTiles();
    indexKeyboardButtons();

    if(hasGameState()) {
        loadGameState();
    } else {
        solution = getRandomWord();
    }

});

function createTiles() {
    let id = 1;
    const gameBoard = document.getElementById("board");
    for (let i = 0; i < 6; i++) {
        let row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 5; j++) {
            let tile = document.createElement("div");
            tile.setAttribute("id", id++);
            tile.classList.add("tile");
            tile.setAttribute("data-state", "empty");
            row.appendChild(tile)
        }
        gameBoard.appendChild(row);
    }
}

function indexKeyboardButtons() {
    const keys = document.querySelectorAll(".keyboard-row button");
    for (let i = 0; i < keys.length; i++) {
        keys[i].onclick = ({ target }) => {
            const letter = target.getAttribute("data-key");

            if (letter ==="enter") {
                handleSubmitWord();
                return;
            }

            if (letter ==="del") {
                handleDeleteLetter();
                return;
            }

            updateGuessedLetter(letter);
        }
    }
}

function updateGuessedLetter(letter) {
    if (rowIndex < 6 && currentWordArr.length < 5) {
        currentWordArr.push(letter);
        console.log(currentTileId)
        const currentTileEl = document.getElementById(String(currentTileId));
        currentTileEl.textContent = letter;
        currentTileEl.setAttribute("data-state", "tbd");
        animateCSS(currentTileEl, "pulse");
        currentTileId += 1;
    }
}

function handleDeleteLetter() {
    if (currentWordArr.length > 0) {
        currentWordArr.pop();
        const tileEl = document.getElementById(String(currentTileId - 1));
        tileEl.textContent = '';
        tileEl.setAttribute("data-state", "empty");
        currentTileId -= 1;
    }
}

function handleSubmitWord() {

    if (rowIndex === 6) {
        window.alert(`Sorry, you have no more guesses! The word is ${solution}`);
        return;
    }

    const currentWord = currentWordArr.join('');

    if(currentWordArr.length !== 5) {
        // TODO: non-existing word verification
        animateCssIncorrectAttempt();
        return;
    }

    updateTileState(currentWordArr, 250);
    updateKeyboardState(currentWordArr, 1500);

    if (currentWord === solution) {
        animateCssWinGame(2000);
        return;
    }

    boardState[rowIndex++] = currentWord;
    currentWordArr = [];
    saveGameState();
}

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

function updateTileState(currentWordArr, interval) {
    const firstTileId = rowIndex * 5 + 1;
    currentWordArr.forEach((letter, index) => {
        setTimeout(() => {
            const dataState = getDataState(letter, index);
            const tileId = firstTileId + index;
            const tileEl = document.getElementById(tileId);
            tileEl.setAttribute("data-state", dataState);
            animateCSS(tileEl, "flipInX");
        }, interval * index);
    });
}

function updateKeyboardState(currentWordArr, interval) {
    setTimeout(() => {
        currentWordArr.forEach((letter, index) => {
            const dataState = getDataState(letter, index);
            const keyEl = document.querySelector(`[data-key=${letter}]`);
            keyEl.setAttribute("data-state", dataState)
        });
    }, interval);
}

function animateCssIncorrectAttempt() {
    const firstTileId = rowIndex * 5 + 1;
    currentWordArr.forEach((item, index) => {
        const tileId = firstTileId + index;
        const tileEl = document.getElementById(tileId);
        animateCSS(tileEl, "headShake");
    });
}

function animateCssWinGame(interval) {
    const firstTileId = rowIndex * 5 + 1;
    setTimeout(() => {
        currentWordArr.forEach((item, index) => {
            setTimeout(() => {
                const tileId = firstTileId + index;
                const tileEl = document.getElementById(tileId);
                animateCSS(tileEl, "bounce");
            }, 100 * index);
        });
    }, interval);
}

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

function handleNewGame() {
    localStorage.clear();
    document.location.reload(true);
}

function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify({
        solution: solution,
        boardState: boardState,
        evaluations: evaluations,
        rowIndex: rowIndex,
    }));
}

function hasGameState() {
    return JSON.parse(localStorage.getItem("gameState")) !== null;
}

function loadGameState() {
    gameState = JSON.parse(localStorage.getItem("gameState"));
    if (gameState) {
        solution = gameState.solution,
        boardState = gameState.boardState,
        evaluations = gameState.evaluations,
        rowIndex = gameState.rowIndex
        currentTileId = rowIndex * 5 + 1
    }
}

// TODO: has to come from wordnik api
function getRandomWord() {

    words = ["ditch", "panic", "chord", "dream", "grief", "swipe", "miner", "cower", "shake", "lunch", "tread", "issue", "index", "scale", "table", "pupil", "break", "jewel", "favor", "smoke", "amuse", "snack", "glass", "sweet", "cheat", "chart", "power", "fairy", "theme", "trade", "frown", "split", "loose", "punch", "drift", "anger", "crown", "crowd", "groan", "habit", "flood"];

    return words[Math.floor(Math.random() * (words.length - 1))];
}