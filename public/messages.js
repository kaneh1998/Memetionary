chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keyup', function (e) {
    if (e.keyCode === 13) {
        sendMessage();
    }
});
function sendMessage() {

    if (chatBox.value == '') {
        return;
    }

    let msg = clientData.username + ": " + chatBox.value;

    if (chatBox.value.toUpperCase().split(" ").includes(currentWordToGuess)) {

        if (clientData.isDrawing) {
            chatBoxMessages.innerHTML += "<h5 class='bg-danger text-light'>Don't cheat!</h5>";
            let xH = chatBoxMessages.scrollHeight; 
            chatBoxMessages.scrollTo(0, xH);
            return;
        }

        // Guessed correctly the word
        let audio = new Audio('/public/audio/correct.wav');
        audio.play();
        msg = "<h5 class='bg-success'>" + clientData.username + " has guessed the word correctly!</h5>";
        socket.emit('addScore', clientData);
        socket.emit('updatePlayerList', clientData);
        onResetCanvas();
        currentWordToGuess = null;
        endGame();
    }

    chatBox.value = '';
    socket.emit("message", msg, room)

}

// Chat Messages
function displayMessage(msg) {
    let audio = new Audio('/public/audio/message.wav');
    audio.play();
    chatBoxMessages.innerHTML += "<h5>" + msg + "</h5>";
    let xH = chatBoxMessages.scrollHeight; 
    chatBoxMessages.scrollTo(0, xH);
}

function sendScoreList() {

    if (scoresSentThisRound == true) {
        return;
    }

    let msg = "<h4 class='border-bottom border-dark bg-info'>SCORES</h4>"

    playerObj.forEach(element => {
        msg += "<h5>" + element.username + " : " + element.score + "</h5>";
    });

    scoresSentThisRound = true;
    socket.emit("message", msg, room);
}

// Gets a random word and displays it
function generateGuessWord(word) {

    if (word == "GAME OVER") {
        guessWord.innerHTML = "GAME OVER";
        startGameBtn.innerHTML = "PLAY AGAIN";
        startGameBtn.style.backgroundColor = 'yellow';
        startGameBtn.style.color = 'black';
        return;
    }

    startGameBtn.innerHTML = "Next Round";
    startGameBtn.style.backgroundColor = 'green';

    currentWordToGuess = word;
    if (!clientData.isDrawing) {
        guessWord.innerHTML = "Start guessing!";
        onResetCanvas();
        return;
    }

    guessWord.innerHTML = word;
}

socket.on("message", message => {
    displayMessage(message);
});