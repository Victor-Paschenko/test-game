const db = require("../../db");
const Game = require("../game");
const { timer } = require("../utils");

const TIME_BEFORE_START = 3;
const OK_STATUS = { status: "ok" };

const failCallbackResponse = (message) => ({
  status: "fail",
  message,
});

const startRoundMessage = (id, round) => ({
  id,
  ...round,
});

const getRoomId = (id) => `Game${id}`;
const gameState = new Game();

module.exports = (io) =>
  io.on("connection", (socket) => {
    socket.on("connectToGame", (data, callback) => {
      try {
        const { game } = db;
        const roomId = getRoomId(data.gameId);

        if (!gameState.isFull()) {
          socket.join(roomId);
          gameState.addPlayer(socket.id);
        }

        if (gameState.isFull() && gameState.getRound() === 0) {
          gameState.lock();
          io.to(roomId).emit("prepare");

          timer(TIME_BEFORE_START, () => {
            const round = gameState.startRound();
            gameState.unlock();

            io.to(roomId).emit(
              "roundStart",
              startRoundMessage(data.gameId, round)
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

        if (!gameState.hasPlayer(id)) {
          return callback(
            failCallbackResponse("You are not a player in this game")
          );
        }

        switch (data.event) {
          case "catch":
            const { position } = data;
            if (gameState.isLocked()) {
              return callback(failCallbackResponse("Round has not started"));
            }
            if (gameState.comparePostions(position)) {
              return callback(failCallbackResponse("Wrong position"));
            }

            gameState.addToHistory(id);
            io.to(roomId).emit("prepare");

            if (gameState.isPlaying()) {
              gameState.lock();

              timer(TIME_BEFORE_START, () => {
                const round = gameState.startRound();

                gameState.unlock();
                io.to(roomId).emit(
                  "roundStart",
                  startRoundMessage(data.gameId, round)
                );
              });
            } else {
              const { statistics, winner } = gameState.gameResult();

              io.to(roomId).emit("gameEnd", {
                ...game,
                statistics,
                winner: { ...statistics[winner.id], id: winner.id },
              });

              gameState.reset();
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
      if (gameState.hasPlayer(socket.id)) {
        gameState.reset();
      }
    });
  });
