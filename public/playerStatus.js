let ready;
let timer = document.getElementById('timer');
let startGameBtn = document.getElementById('startGameBtn');
let gameTimer;
let navBar = document.getElementById('navBar');

let numOfPlayersInGame;

startGameBtn.addEventListener('click', startGame);
function startGame(e) {
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
    gameTimer = msg.time;
    generateGuessWord(msg.word);
    timer.innerHTML = gameTimer;
    timerInterval = setInterval(timerFunc, 1000);

}

function makeCanvasUnscrollable() {
    canvas.style.touchAction = "none";
}


function resetGame() {

    canvas.style.touchAction = "";
    window.scrollTo(0, 0);
    timer.innerHTML = "Times up";
    generateGuessWord("Word will appear here...");
    startGameBtn.style.display = "inline";
    gameStarted = false;
    clientData.isDrawing = false;
    onResetCanvas();
    clearInterval(timerInterval);
    sendScoreList();
}

function gameComplete(roomObj) {
    gameObj = roomObj;
    generateGuessWord("GAME OVER");
}

socket.on('timerStart', msg => {
    onTimerUpdate(msg);
})
socket.on('endGame', () => {
    resetGame();
});
socket.on('gameComplete', roomObj => {
    gameComplete(roomObj);
})