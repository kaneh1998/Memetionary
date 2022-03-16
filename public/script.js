let socket = io();

let playerListCol = document.getElementById('playerListCol');
let playerList = document.getElementById('playerList');
let playerCounter = document.getElementById('playerCounter');
let chatBoxMessages = document.getElementById('chatBoxMessages');
let chatSend = document.getElementById('chatSend');
let chatBox = document.getElementById('chatBox');
let guessWord = document.getElementById('guessWord');
let chatInput = document.getElementById('chatBox');
let drawingSection = document.getElementById('drawingSection');
let brushSection = document.getElementById('brushSection');

let scoresSentThisRound = false;

/**
 * Game Variables
 */
let selectedColourObj;
let currentWidthObj;

let gameStarted = false;
let currentWordToGuess = undefined;

let canvas, ctx, flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    dot_flag = false;

let current = {
    color: "black"
}
let lineWidth = 2;

// Contains SERVER SIDE data about PLAYERS IN ROOM
let playerObj = {};

// Game data
let gameObj = {};

let audio = document.createElement("audio");
let timerInterval;

// GET ROOM ID
let room = '123'; 
// CLIENT DATA
let clientData;
function GetRoomID() {
    fetch('/userData')
        .then(response => response.json())
        .then(data => {
            startGameBtn.style.display = "none";
            audio.src = '/public/audio/bg-music.mp3';
            audio.loop = true;
            audio.volume = 0.5;
            audio.play();
            socket.emit("joinedRoom", data);
            clientData = data;
            room = data.roomID;
            navBar.innerHTML = "Memetionary || RoomID: " + data.roomID;
            socket.emit("updatePlayerList", data);
        })
        .catch((err) => {
            startGameBtn.style.display = "none";
            let errBtn = document.createElement('button');
            errBtn.innerHTML = "Something went wrong... Click HERE";
            errBtn.className = 'button btn-danger p-4';
            errBtn.onclick = function (event) {
                event.preventDefault();
                window.location = '/';
            }
            playerList.appendChild(errBtn);
        });
}

// BASIC SETUP OF CANVAS AND VARIABLES
function init() {
    canvas = document.getElementById('can');
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;

    // Can scroll on canvas
    canvas.style.touchAction = "";

    //Write onto ctx
    onResetCanvas();
    ctx.font = "30px Arial";
    ctx.fontColor = "black";
    ctx.fillText("Wait for your friends,", 10, 50);
    ctx.fillText("Then press Start Game!", 10, 100);

    canvas.addEventListener("mousemove", function (e) {
        findxy('move', e)
    }, false);
    canvas.addEventListener("mousedown", function (e) {
        findxy('down', e)
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        findxy('up', e)
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e)
    }, false);

    // Mobile Events
    canvas.addEventListener("touchmove", function (e) {
        findxy('move', e)
    }, false);
    canvas.addEventListener("touchstart", function (e) {
        findxy('down', e)
    }, false);
    canvas.addEventListener("touchend", function (e) {
        findxy('up', e)
    }, false);
    canvas.addEventListener("touchcancel", function (e) {
        findxy('out', e)
    }, false);

}

// SOCKET DRAW
function drawLine(x0, y0, x1, y1, lineWidthemit, color) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidthemit;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

}

function draw() {
    // Check game has started and the client has been selected to draw
    if (!gameStarted) {
        return;
    }

    canvas.style.touchAction = "none";

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = current.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    var w = canvas.width;
    var h = canvas.height;

    socket.emit("drawing", {
        x0: currX / w,
        y0: currY / h,
        x1: prevX / w,
        y1: prevY / h,
        lineWidth: lineWidth,
        color: current.color,
        roomID: room
    });
}

// Mouseevent or touch event
function findxy(res, e) {
    if (!gameStarted) {
        return;
    }

    // Check only the user who isDrawing can draw (Done client side but cant be bothered setting up server side drawing)
    for (let i = 0; i < playerObj.length; i++) {

        if (clientData.username && !playerObj[i].isDrawing && playerObj[i].username == clientData.username) {
            return;
        }
    }

    let rectTouch = e.target.getBoundingClientRect();
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = e.offsetX || e.touches[0].clientX - rectTouch.x;
        currY = e.offsetY || e.touches[0].clientY - rectTouch.y;

        flag = true;
        dot_flag = true;
        if (dot_flag) {
            ctx.beginPath();
            ctx.fillStyle = current.color;
            ctx.fillRect(currX, currY, 2, 2);
            ctx.closePath();
            dot_flag = false;
        }
    }
    if (res == 'up' || res == "out") {
        flag = false;
    }
    if (res == 'move') {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = e.offsetX || e.touches[0].clientX - rectTouch.x;
            currY = e.offsetY || e.touches[0].clientY - rectTouch.y;
            draw();
        }
    }
}

// Reset Canvas Eveent
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);
    socket.emit("resetCanvas", room);
}

// Inline-HTML function call - Event is the HTML element, e is teh event
function selectColor(event, e) {

    try {
        // Must be set to its previous colour
        selectedColourObj.backgroundColor = current.color;
    } catch {

    }

    event.style.backgroundColor = "grey";
    selectedColourObj = event.style;
    current.color = e;

}

// Inline-HTML Function call
function selectBrush(event, e) {

    try {
        currentWidthObj.backgroundColor = "black";
    } catch {

    }

    event.style.backgroundColor = "grey";
    currentWidthObj = event.style;
    lineWidth = e;
}

// Drawing event from SOCKET
function onDrawingEvent(data) {
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.lineWidth, data.color);
}

// RESET CANVAS SOCKET
function onResetCanvas(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);
}


/**
 * 
 * @param dat Player data
 * 
 * dat contains PlayerData of all players in room
 * 
 */
function onPlayerList(dat) {

    let readyCount = 0;
    let audio = new Audio('/public/audio/connected.wav');
    audio.play();
    playerList.innerHTML = "";
    playerCounter.innerHTML = dat.length;

    for (let i = 0; i < dat.length; i++) {
        // clientData.username will be different for each person who joins!
        if (dat[i].ready) {
            readyCount++;

            // ADD ANOTHER CHECK IN HERE TO CEHCK IF CLIENTDATA.ISADMIN - THEN DRAW KICKBUTTONS

            // Player IS ADMIN
            if (dat[i].isAdmin) {
                playerList.innerHTML += "<br/><button class='button rounded btn-success me-5 mt-1 p-1 playerReadyBtn' id='" + 
                dat[i].username + "'>Ready</button><h4 class='fw-bold' style='display: inline;'>👑 " + 
                dat[i].username + " | " + dat[i].score + "</h4>";
                continue;
            }

            playerList.innerHTML += "<br/><button class='button rounded btn-success me-5 mt-1 p-1 playerReadyBtn' id='" + 
            dat[i].username + "'>Ready</button><h4 style='display: inline;'>" + 
            dat[i].username + " | " + dat[i].score + " | </h4><button class='button btn-info rounded playerKickBtn' id='" + dat[i].username + "Kick'>Kick</button>";
            continue;
        }

        if (dat[i].isAdmin) {
            playerList.innerHTML += "<br/><button class='button rounded btn-danger me-5 mt-1 p-1 playerReadyBtn' id='" + 
            dat[i].username + "'>Ready</button><h4 class='fw-bold' style='display: inline;'>👑 " + 
            dat[i].username + " | " + dat[i].score + "</h4>";
            continue;
        }

        playerList.innerHTML += "<br/><button class='button rounded btn-danger me-5 mt-1 p-1 playerReadyBtn' id='" + 
        dat[i].username + "'>Ready</button><h4 style='display: inline;'>" + dat[i].username + " | " + 
        dat[i].score + " | </h4><button class='button btn-info rounded playerKickBtn' id='" + dat[i].username + "Kick'>Kick</button>";

    }

    let playerBtns = document.getElementsByClassName('playerReadyBtn');
    let kickBtns = document.getElementsByClassName('playerKickBtn');

    console.log(gameObj);
    console.log(dat);

    if (!gameObj.gameActive) {

        // All players are ready - show the start game button
        if (readyCount == playerBtns.length) {
            checkIfAdmin(clientData);
        } else {
            startGameBtn.style.display = "none";
        }
    }
    

    for (let i = 0; i < playerBtns.length; i++) {
        playerBtns[i].addEventListener('click', setReadyButton, false);

        if (i == 0) {
            continue;
        }
        kickBtns[i - 1].addEventListener('click', kickUser, false);
    }

}

function kickUser(event) {

    // Can't kick people if not admin
    if (!clientData.isAdmin) {
        return;
    }

    let words = event.target.id.split("Kick");
    let userToKick = words[0];

    console.log("kicking user");
    console.log(clientData);

    socket.emit('kickUser', userToKick, clientData);

}


function checkIfAdmin(clientData) {

    if (clientData.isAdmin) {
        startGameBtn.style.display = "inline";

    } else {
        startGameBtn.style.display = "none";
    }
}

let setReadyButton = function () {

    if (clientData.username != this.id) {
        return;
    }

    if (gameStarted) {
        return;
    }

    // Make player 'ready'
    socket.emit('playerReady', clientData);

}

GetRoomID();
init();

socket.on("updatePlayerList", (playerList, gameData) => {
    playerObj = playerList;
    gameObj = gameData;
    if (playerList.find(o => o.username == clientData.username) == null) {
        console.log("Kicked form the game");
        window.location = '/'; 
    }

    clientData = playerList.find(o => o.username == clientData.username);
    onPlayerList(playerList);
});

socket.on("drawing", onDrawingEvent);

socket.on("resetCanvas", onResetCanvas);

socket.on("disconnect", msg => {
    console.log("Disconnect siocket ON script");
    displayMessage(msg);
});

socket.on('addScore', data => {
    clientData = data;
});