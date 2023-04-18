const { defaultGameState } = require("../../config");
const { getRandom } = require("../utils");
class Game {
  constructor() {
    this.reset();
  }
  reset() {
    this.state = {
      ...defaultGameState,
      currentPlayers: [],
      history: [],
      position: [],
    };
  }

  isFull() {
    return this.state.currentPlayers.length >= this.state.players;
  }

  lock() {
    this.state.lock = true;
  }

  isLocked() {
    this.state.lock;
  }

  unlock() {
    this.state.lock = false;
  }

  addPlayer(id) {
    this.state.currentPlayers.push(id);
  }

  hasPlayer(id) {
    return this.state.currentPlayers.includes(id);
  }

  addToHistory(id) {
    this.state.history.push({ id, time: Date.now() - this.state.roundStart });
  }

  getRound() {
    return this.state.currentRound;
  }

  startRound() {
    this.state.roundStart = Date.now();
    this.state.position = [
      getRandom(0, this.state.rows),
      getRandom(0, this.state.columns),
    ];
    this.state.currentRound++;
    return {
      round: this.state.currentRound,
      position: this.state.position,
    };
  }

  isPlaying() {
    return this.state.currentRound < this.state.rounds;
  }

  comparePostions(position) {
    return position.join("") !== this.state.position.join("");
  }

  gameResult() {
    let winner = { count: 0 };
    const statistics = this.state.history.reduce((acc, cur) => {
      const { time, id } = cur;
      const { count, totalTime } = acc[id] || { count: 0, totalTime: 0 };
      
      if (winner.count < count + 1) {
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
  }
}

module.exports = Game;
