const db = require("../../db");
const {
  reset,
  isFull,
  lock,
  unlock,
  addPlayer,
  hasPlayer,
  addToHistory,
  comparePostions,
  startRound,
  gameResult,
} = require("../game");
const { timer } = require("../utils");

const TIME_BEFORE_START = 3;
const OK_STATUS = { status: "ok" };

const failCallbackResponse = (message) => ({
  status: "fail",
  message,
});

const startRoundMessage = (id, game) => ({
  id,
  round: ++game.currentRound,
  position: game.position,
});

const getRoomId = (id) => `Game${id}`;

module.exports = (io) =>
  io.on("connection", (socket) => {
    socket.on("connectToGame", (data, callback) => {
      try {
        const { game } = db;
        const roomId = getRoomId(data.gameId);

        if (!isFull(game)) {
          socket.join(roomId);
          addPlayer(game, socket.id);
        }

        if (isFull(game) && game.currentRound === 0) {
          lock(game);
          io.to(roomId).emit("prepare");

          timer(TIME_BEFORE_START, () => {
            startRound(game);
            unlock(game);

            io.to(roomId).emit(
              "roundStart",
              startRoundMessage(data.gameId, game)
            );
          });
        }

        callback(OK_STATUS);
      } catch (e) {
        console.log(e);
        callback(failCallbackResponse("Something went wrong"));
      }
    });

    socket.on("game", (data, callback) => {
      try {
        const { game } = db;
        const { id } = socket;
        const roomId = getRoomId(data.gameId);

        if (!hasPlayer(game, id)) {
          return callback(
            failCallbackResponse("You are not a player in this game")
          );
        }

        switch (data.event) {
          case "catch":
            const { position } = data;
            if (game.lock) {
              return callback(failCallbackResponse("Round has not started"));
            }
            if (comparePostions(game, position)) {
              return callback(failCallbackResponse("Wrong position"));
            }

            addToHistory(game, id);
            io.to(roomId).emit("prepare");

            if (game.currentRound < game.rounds) {
              lock(game);

              timer(TIME_BEFORE_START, () => {
                startRound(game);

                unlock(game);
                io.to(roomId).emit(
                  "roundStart",
                  startRoundMessage(data.gameId, game)
                );
              });
            } else {
              const { statistics, winner } = gameResult(game);

              io.to(roomId).emit("gameEnd", {
                ...game,
                statistics,
                winner: { ...statistics[winner.id], id: winner.id },
              });

              db.game = reset();
              io.in(roomId).socketsLeave(roomId);
            }

            break;
          default:
            return callback(failCallbackResponse("No event was sent"));
        }

        callback(OK_STATUS);
      } catch (e) {
        console.log(e);
        callback(failCallbackResponse("Something went wrong"));
      }
    });

    socket.on("disconnecting", () => {
      if (db.game.currentPlayers.includes(socket.id)) {
        db.game = reset();
      }
    });
  });
