chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keyup', function (e) {

    window.scrollTo(0, 106);

    if (e.keyCode === 13) {
        sendMessage();
    }
});

// SCROLL WINDOW TO TOP OF CANVAS - SHOULD WORK ON MOST MOBILES
chatBox.addEventListener('click', function (e) {
    window.scrollTo(0, 106);
});

function sendMessage() {

    if (chatBox.value == '') {
        return;
    }

    let msg = clientData.username + ": " + chatBox.value;

    // Got the correct word
    if (chatBox.value.toUpperCase().split(" ").includes(currentWordToGuess)) {

        // Can't guess the word if you are the drawer
        if (clientData.isDrawing) {
            chatBoxMessages.innerHTML += "<h5 class='bg-danger text-light'>Don't cheat!</h5>";
            let xH = chatBoxMessages.scrollHeight; 
            chatBoxMessages.scrollTo(0, xH);
            return;
        }

        
        let audio = new Audio('/public/audio/correct.wav');
        audio.play();
        msg = "<h5 class='bg-success'>" + clientData.username + " has guessed the word correctly!</h5>";
        msg += "<h4 class='bg-info'>The word was... " + currentWordToGuess + "</h4>"; 
        socket.emit('addScore', clientData);
        socket.emit('updatePlayerList', clientData);
        onResetCanvas();
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

    console.log(gameObj);

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