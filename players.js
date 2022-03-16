class Player {

    socketID;
    username;
    roomID;
    ready;
    isDrawing;
    hasDrawn;
    score;
    isAdmin;

    constructor(socketID, username, roomID) {

        this.socketID   = socketID;
        this.username   = username;
        this.roomID     = roomID;
        this.ready      = false;
        this.isDrawing  = false;
        this.hasDrawn   = false;
        this.score      = 0;
        this.isAdmin    = false;
    }

}

module.exports = Player