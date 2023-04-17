const { defaultGameState } = require("../../config");
const { getRandom } = require("../utils");

module.exports = {
  reset: () => ({
    ...defaultGameState,
    currentPlayers: [],
    history: [],
    position: [],
  }),

  isFull: (game) => game.currentPlayers.length >= game.players,
  lock: (game) => (game.lock = true),
  unlock: (game) => (game.lock = false),
  addPlayer: (game, id) => game.currentPlayers.push(id),
  hasPlayer: (game, id) => game.currentPlayers.includes(id),
  addToHistory: (game, id) =>
    game.history.push({ id, time: Date.now() - game.roundStart }),
  startRound: (game) => {
    game.roundStart = Date.now();
    game.position = [getRandom(0, game.rows), getRandom(0, game.columns)];
  },

  comparePostions: (game, position) =>
    position.join("") !== game.position.join(""),

  gameResult: (game) => {
    let winner = { count: 1 };
    const statistics = game.history.reduce((acc, cur) => {
      const { time, id } = cur;
      const { count, totalTime } = acc[id] || {};

      if (count && winner.count < count + 1) {
        winner.id = id;
        winner.count = count + 1;
      }

      return {
        ...acc,
        ...{
          [id]: {
            count: count + 1 || 1,
            totalTime: (totalTime || 0) + time,
          },
        },
      };
    }, {});

    return { statistics, winner };
  },
};
