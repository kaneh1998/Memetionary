let ready;
let timer = document.getElementById('timer');
let startGameBtn = document.getElementById('startGameBtn');
let gameTimer;
let navBar = document.getElementById('navBar');

let numOfPlayersInGame;

startGameBtn.addEventListener('click', startGame);
function startGame(e) {

    console.log(clientData);
    // Make sure only the admin can start a game
    if (!clientData.isAdmin) {
        displayMessage("Only the admin can use this!");
        startGameBtn.style.display = "none";
        return;
    }

    scoresSentThisRound = false;
    onResetCanvas();
    socket.emit("resetCanvas", room);
    socket.emit('timerStart', clientData);
}

function startCountdownAudio() {
    let audio = new Audio('/public/audio/10seconds.wav');
    audio.play();
}

// Timer functions
function timerFunc() {

    gameTimer--;
    timer.innerHTML = gameTimer;

    if (gameTimer == 8) {
        startCountdownAudio();
    }

    if (gameTimer <= 0) {
        gameTimer = 0;
        endGame();
    }
}


// End game function - resets various variables
function endGame() {

    // emit end of round socket
    onResetCanvas();
    socket.emit("endGame", clientData);
    socket.emit("resetCanvas", room);

}

function onTimerUpdate(msg) {

    numOfPlayersInGame = msg.numberOfPlayers;

    // PlayerObj is updated - only the playerObj where isDrawing can draw
    playerObj = msg.playerObj;

    for (let i = 0; i < playerObj.length; i++) {
        if (playerObj[i].username == clientData.username) {
            clientData.isDrawing = playerObj[i].isDrawing;
        }
    }

    startGameBtn.style.display = "none";
    gameStarted = true;
    if (clientData.isDrawing) {
        drawingSection.style.display = "flex";
        brushSection.style.display = "flex";
        displayMessage(msg.message);
        makeCanvasUnscrollable();
    } else {
        drawingSection.style.display = "none";
        brushSection.style.display = "none";
        displayMessage("Guess the word in the chat!");
    }
    playerListCol.style.display = "none";
    gameTimer = msg.time;
    generateGuessWord(msg.word);
    timer.innerHTML = gameTimer;
    timerInterval = setInterval(timerFunc, 1000);

}

function makeCanvasUnscrollable() {
    canvas.style.touchAction = "none";
}

// Called on the end of the round when word is geussed or time runs out
function resetGame() {

    // Display player list
    playerListCol.style.display = "inline";
    // Canvas is scrollable
    canvas.style.touchAction = "";
    window.scrollTo(0, 0);
    // The word that was geussed correctly
    timer.innerHTML = currentWordToGuess;
    // Make it say - 'USER got the correct word'
    generateGuessWord(currentWordToGuess);
    checkIfAdmin(clientData);
    gameStarted = false;
    clientData.isDrawing = false;
    currentWordToGuess = null;
    onResetCanvas();
    clearInterval(timerInterval);
}

function gameComplete(roomObj) {
    gameObj = roomObj;
    generateGuessWord("GAME OVER");
}

socket.on('timerStart', (msg, gameData) => {
    gameObj = gameData;
    onTimerUpdate(msg);
})
socket.on('endGame', () => {
    resetGame();
});
socket.on('gameComplete', roomObj => {
    gameComplete(roomObj);
})