const { defaultGameState } = require("../config");

module.exports = {
  reset: () => ({
    ...defaultGameState,
    currentPlayers: [],
    history: [],
    position: [],
  }),
};
