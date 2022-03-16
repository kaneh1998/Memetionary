class Room {

    roomID;
    gameActive;
    playerNumber;
    roundNumber;
    playerList;         // Array of Players
    totalGamesPlayed;   // Number of full games played
    lastWord;           // Last word that was used
    usedWords;          // Array of words;

    constructor(roomID) {
        this.roomID             = roomID;
        this.gameActive         = false;
        this.playerList         = new Array();
        this.playerNumber       = this.playerList.length;
        this.roundNumber        = 0;
        this.totalGamesPlayed   = 0;
        this.lastWord           = null;
        this.usedWords          = new Array();
    }

    setGameActive(TorF) {
        this.gameActive = TorF;
    }

    incrPlayerNumber() {
        this.playerNumber = this.playerNumber + 1;
    }

    decrPlayerNumber() {
        this.playerNumber = this.playerNumber - 1;
    }

    getPlayers() {
        return this.playerList;
    }
}

module.exports = Room