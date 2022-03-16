const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {});
const session = require('express-session');
const port = 3000;

// Classes
const Room = require('./rooms');
const Player = require('./players');

// SOCKET VARIABLES
// Rooms - Stores all roomnumbers and if they are currently playing or not + number of players in the room
let rooms = [];
let drawTime = 60;
let wordList = [
  'TREE', 'BUILDING', 'AIRPLANE', 'BEARD', 'TABLE', 'CHURCH', 'PEN', 'PINEAPPLE', 'BOTTLE', 'ANGRY', 'FIREWORKS', 'PUMPKIN', 'RECYCLE', 'GLASSES', 'LION', 'CAT', 
  'MAILBOX', 'TRUCK', 'VOLLEYBALL', 'PEANUT', 'NOSE', 'OLYMPICS', 'EGG', 'GIRAFFE', 'FLOWER', 'BABY', 'BIBLE', 'MERMAID', 'NURSE', 'TEEPEE', 'TUTU', 'PIANO', 
  'FLAG', 'OWL', 'NURSE', 'MUSIC', 'SLIPPER', 'LOLLIPOP', 'KIWI', 'BUS', 'CASTLE', 'ROBOT', 'RAINDROP', 'SKIP', 'KOALA', 'SPACE', 'DANCE', 'CRIB', 'MUM',
  'THREAD', 'ZOMBIE', 'PILGRAM', 'PHOTO', 'FLAT', 'FACEBOOK', 'YOUTUBE', 'MASK', 'HOTEL', 'FIREWORKS', 'CONE', 'TOOTHBRUSH', 'STAR', 'STRAWBERRY', 'WOMAN',
  'PIZZA', 'BANANA', 'DITCH', 'JAZZ', 'DOWNLOAD', 'BARGAIN', 'VITAMIN', 'HUSBAND', 'BARBER', 'PEANUT', 'SAUSAGE', 'SUNSHINE', 'GOLF', 'BOWLING', 'FOG', 
  'HEAVY', 'DESK', 'PANIC', 'PAIN', 'MAGIC', 'CLOSET', 'DARK', 'FOUL', 'TACKLE', 'DICTIONARY', 'DANCE', 'CALENDAR', 'HELMET', 'LIGHTNING', 'COOKING',
  'ASTRONAUT', 'TORNADO', 'MAGIC', 'MORNING', 'FAIL', 'BACKPACK', 'UNICORN', 'GOOSEBUMPS', 'ICE', 'FLAME', 'TOOTH', 'TABLE', 'CLOTHES', 'BRA', 'JACKET',
  'PAINTING', 'PLATE', 'LEAF', 'BLOOD', 'SLUG', 'MOSS', 'FAMILY', 'CEREAL', 'UNDERWEAR', 'YAWN', 'FROG', 'ELEPHANT', 'DOG', 'CAT', 'ZEBRA', 'WAFFLE',
  'GHOST', 'RUPERT', 'LATE', 'AFTERNOON', 'EVENING', 'BOSS', 'HIRE', 'PADDLE', 'PRIDE', 'MEETING', 'TURBAN', 'TYRE', 'PAY', 'WORRY', 'POVERTY', 
  'SNEAKER', 'NINJA', 'FOOTBALL', 'SWING', 'INFECTION', 'CARROT', 'APPLE', 'WATERMELON', 'CHICKEN', 'PIG', 'MONKEY', 'WINDOW', 'PROGRAM'
];

// CUSTOM WORDLISTS
let matesList = [
  'KANE', 'LACHLAN', 'EVAN', 'JACOB', 'THEO', 'ANTHONY', 'CALLUM', 'SOPHIA',
  'BRAD', 'CAMPBELL', 'NICK', 'LETITIA', 'HTOO', 'JAI'
];

// MIDDLEWARE
app.use(session({
  secret: 'password',
  resave: true,
  saveUninitialized: true
}));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// SERVER FILE LOCATION
app.use(express.static(__dirname));

// Default to client's index.html if no parameters are passed
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/join.html');
});

// This is sent once a user joins a room
app.get('/userData', (req, res) => {

  let playerData;
  let roomPlayerIn;

  try {
    roomPlayerIn = rooms.find(o => o.roomID === req.session.roomID).playerList;
    playerData = roomPlayerIn.find(o => o.username === req.session.username);

  } catch {

    res.sendFile(__dirname + '/public/join.html');
    return;
  }

  res.json(playerData);
});

// Joining room
app.post('/join', (req, res) => {

  if (req.body.room == '' || req.body.room == null || req.body.room == undefined || req.body.username == '') {
    res.redirect('/'); 
    return;
  }

  let roomNum;
  let roomJoined        = findRoomByRoomID(req.body.room);

  req.session.roomID    = req.body.room;
  req.session.username  = req.body.username;

  // found room that exists
  if (roomJoined != null) {
    roomNum = roomJoined;

    // IF GAME ACTIVE - DO NOT LET JOIN
    if (roomNum.gameActive == true) {
      res.redirect('/'); 
      return;
      // IF GME NOT ACTIve - JOIN BUT DO NOT ADD ROOM
    } else {

      // CHECK nobody in the room has the same username
      if (roomJoined.playerList.find(o => o.username == req.session.username) != null) {
        res.redirect('/');
        return;
      }

      roomJoined.playerNumber++;
      let player = new Player('0', req.body.username, req.body.room);
      roomJoined.playerList.push(player);
      res.redirect('/game');
      return;
    }
  }

  let rum         = new Room(req.body.room);
  let player      = new Player('0', req.body.username, req.body.room);
  player.isAdmin  = true;

  // Add player to the player list && push onto the rooms array
  rum.playerList.push(player);
  rooms.push(rum);

  res.redirect('/game');

});

app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

/* WEB SOCKET CODE
*
*/
const onConnection = socket => {

  socket.on("joinedRoom", (data) => {

    let roomPlayerIn = rooms.find(o => o.roomID === data.roomID).playerList;
    let playerData = roomPlayerIn.find(o => o.username === data.username);
    playerData.socketID = socket.id;

    socket.join(data.roomID);
    updatePlayersInRoom(data.roomID, data.username, socket.id);
  });

  socket.on("updatePlayerList", (data) => {
    io.to(data.roomID).emit("updatePlayerList", getCurrentPlayersInRoom(data.roomID), findRoomByRoomID(data.roomID));
  });

  socket.on("drawing", (data) => {
    socket.to(data.roomID).emit("drawing", data);
  });

  socket.on("resetCanvas", (room) => {
    socket.to(room).emit("resetCanvas", room);
  });

  socket.on("message", (msg, room) => {
    io.to(room).emit("message", msg);
  });

  // [Client data]
  socket.on('playerReady', (data) => {

    setReadyByUserAndRoom(data.username, data.roomID);

    io.to(data.roomID).emit("updatePlayerList", getCurrentPlayersInRoom(data.roomID), findRoomByRoomID(data.roomID));
  });

  // KICK USER
  socket.on('kickUser', (usernameToKick, clientData) => {

    removeUserFromRoom(usernameToKick, clientData);

    io.to(clientData.roomID).emit('updatePlayerList', getCurrentPlayersInRoom(clientData.roomID), findRoomByRoomID(clientData.roomID));
  });

  // GAME START - [client data]
  socket.on('timerStart', (data) => {

    // Starts new game
    let roomObj;
    
    // Someone might try to start a game before all players are ready
    try {
      roomObj = rooms.find(o => o.roomID == data.roomID);
      roomObj.gameActive = true;
    } catch {
      return;
    }
    

    // End of game if all rounds have been completed
    if (roomObj.playerList.length <= roomObj.roundNumber) {
      roomObj.gameActive = false;
      // Emit end of game here
      resetDrawnCounter(roomObj);
      roomObj.totalGamesPlayed++;
      io.to(data.roomID).emit("gameComplete", roomObj);
      return;
    }

    startNewRound(data.roomID);
    

    let obj = {
      time: drawTime,
      word: GenerateGameWord(rooms.find(o => o.roomID == data.roomID)),
      message: "Start drawing!",
      playerObj: rooms.find(o => o.roomID == data.roomID).playerList,
      numberOfPlayers: rooms.find(o => o.roomID == data.roomID).playerList.length
    }

    io.to(data.roomID).emit("timerStart", obj, findRoomByRoomID(data.roomID));
  });

  socket.on('addScore', data => {
    // data = client data only
    addScoreToPlayer(data);
    io.to(socket.id).emit("addScore", data);
  });

  socket.on("endGame", (data) => {

    try {
      findRoomByRoomID(data.roomID).gameActive = false;
    } catch {

    }

    io.to(data.roomID).emit("endGame", data);

  });

  socket.on("disconnecting", () => {

    disconnectPlayerRoom(socket.rooms);
  });

  socket.on("disconnect", () => {

  });
};

io.on("connection", onConnection);

http.listen(process.env.PORT || port, () => {
  console.log("Server started in port " + port + ".");
});

// ADD SCORE TO PLAYER
function addScoreToPlayer(data) {

  // Client data sent
  data.score++;

  // Sync server data to client data
  let room = rooms.find(o => o.roomID == data.roomID);
  room.playerList.find(o => o.username == data.username).score++;

}

// RESET Drawn Counter - REPLAY
function resetDrawnCounter(roomObj) {

  let playerList = roomObj.playerList;

  // Reset round number
  roomObj.roundNumber = 0;

  // Reset drawn counter
  playerList.forEach(element => {

    element.isDrawing = false;
    element.hasDrawn = false;
    
  });

}

// FIND room by ID in rooms Array - return room
function findRoomByRoomID(roomID) {

  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].roomID == roomID) {
      return rooms[i];
    }
  }

  return null;

}

// REMOVE USER FROM ROOM
function removeUserFromRoom(username, clientData) {

  let indexOfRoom = rooms.findIndex(o => o.roomID == clientData.roomID);


  let roomPlayerList = rooms.find(o => o.roomID == clientData.roomID);

  roomPlayerList.playerList = roomPlayerList.playerList.filter(o => o.username != username);

  rooms[indexOfRoom] = roomPlayerList;

}

// DISCONNECT players from room
function disconnectPlayerRoom(data) {

  // Data - set contains socketID and room
  const [socketID, room] = data;

  // Will need to try find if any players remain if rooms;
  let roomSocketIn = rooms.find(o => o.roomID == room);
  if (roomSocketIn == undefined) {
    return;
  }
  roomSocketIn.playerList = roomSocketIn.playerList.filter(o => o.socketID != socketID );

  // If playerList.length == 0 => delte room
  if (roomSocketIn.playerList.length == 0) {
    rooms = rooms.filter(o => o.roomID != room)
  }

  // Check if the admin left and if so - assign new admin
  if (rooms.find(o => o.roomID == room) != null) {

    if (roomSocketIn.playerList.find(o => o.isAdmin == true) == null) {
      roomSocketIn.playerList[0].isAdmin = true;
    }

    io.to(room).emit("updatePlayerList", getCurrentPlayersInRoom(room), findRoomByRoomID(room));
  }

}

// Update the players in room object
function updatePlayersInRoom(room, username, socketID) {

  let playerList = rooms.find(o => o.roomID == room).playerList;
  let player = playerList.find(o => o.username == username);
  player.socketID = socketID;

}

function startNewRound(roomID) {

  // Find the room and set game active to true
  let roomObj = rooms.find(o => o.roomID == roomID);
  roomObj.gameActive = true;

  // End of game if all rounds have been completed
  if (roomObj.playerList.length <= roomObj.roundNumber) {
    roomObj.gameActive = false;
    // Emit end of game here
    io.emit("gameComplete", roomObj);
    return;
  }

  // All players before must have isDrawing set to false;
  for (let i = 0; i < roomObj.roundNumber; i++) {
    roomObj.playerList[i].isDrawing = false;
  }

  roomObj.playerList[roomObj.roundNumber].isDrawing = true;
  roomObj.playerList[roomObj.roundNumber].hasDrawn = true;

  roomObj.roundNumber++;

}

// Return object with lpayers in a room - Correct and working
function getCurrentPlayersInRoom(room) {

  return rooms.find(o => o.roomID == room).playerList;

}

// Set player to ready by username and room number
function setReadyByUserAndRoom(username, roomID) {

  let playerList = getCurrentPlayersInRoom(roomID);

  let playerObj = playerList.find(o => o.username == username);
  playerObj.ready = !playerObj.ready;

}

// Returns bool is word has been sued already
function CheckWordUsedAlready(gameObj, word) {

  for (let i = 0; i < gameObj.usedWords.length; i++) {
    if (gameObj.usedWords[i] == word) {
      return true;
    }
  }

  return false;

}


// GAMEPLAY - Select Word
function GenerateGameWord(data) {

  let x = Math.round(Math.random() * wordList.length - 1);

  if (x <= 0) {
    x = 0;
  }

  if (data.lastWord != null) {

    // Check that words are not being repeated.
    while (wordList[x] == data.lastWord || CheckWordUsedAlready(data, wordList[x])) {

      // All words have been used
      if (wordList.length == data.usedWords.length) {
        data.lastWord = "All words used!";
        return "All words used! Start new game";
      }

      x = Math.round(Math.random() * wordList.length - 1);

      if (x <= 0) {
        x = 0;
      }
  
    }

  }

  data.lastWord = wordList[x];
  data.usedWords.push(wordList[x]);

  console.log(data.usedWords);

  return wordList[x];

}