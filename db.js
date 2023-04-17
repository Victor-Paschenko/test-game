const { defaultGameState } = require("./config");

const Database = {
  // {
  //  players: number,
  //  rounds: number,
  //  currentRound: number,
  //  currentPlayers: [...socket.ids],
  //  rows: number,
  //  columns: number,
  //  position: [row, column],
  // }
  game: {
    ...defaultGameState,
    currentPlayers: [],
    history: [],
    position: [],
  },
};

module.exports = Database;
