const db = require("../db");
const { reset } = require("../game");
const { getRandom, timer } = require("../utils");

const TIME_BEFORE_START = 3;

module.exports = (io) =>
  io.on("connection", (socket) => {
    socket.on("connectToGame", (data, callback) => {
      try {
        const { game } = db;

        if (game.currentPlayers.length < game.players) {
          socket.join(`Game${data.gameId}`);
          game.currentPlayers.push(socket.id);
        }

        if (
          game.currentPlayers.length === game.players &&
          game.currentRound === 0
        ) {
          game.lock = true;
          io.to(`Game${data.gameId}`).emit("prepare");
          timer(TIME_BEFORE_START, () => {
            game.roundStart = Date.now();
            game.position = [
              getRandom(0, game.rows),
              getRandom(0, game.columns),
            ];
            game.lock = false;
            io.to(`Game${data.gameId}`).emit("roundStart", {
              id: data.gameId,
              round: ++game.currentRound,
              position: game.position,
            });
          });
        }

        callback({
          status: "ok",
          // token,
        });
      } catch (e) {
        console.log(e);
        callback({
          status: "fail",
        });
      }
    });

    socket.on("game", (data, callback) => {
      try {
        const { event } = data;
        const { game } = db;
        const { id } = socket;

        if (!game.currentPlayers.includes(id)) {
          return callback({
            status: "fail",
            reason: "You are not a player in this game",
          });
        }

        switch (event) {
          case "catch":
            const { position } = data;
            if (game.lock) {
              return callback({
                status: "fail",
                reason: "Round has not started",
              });
            }
            if (position.join("") !== game.position.join("")) {
              return callback({
                status: "fail",
                reason: "Wrong position",
              });
            }
            game.history.push({ id, time: Date.now() - game.roundStart });

            io.to(`Game${data.gameId}`).emit("prepare");

            if (game.currentRound < game.rounds) {
              game.lock = true;

              timer(TIME_BEFORE_START, () => {
                game.roundStart = Date.now();
                game.position = [
                  getRandom(0, game.rows),
                  getRandom(0, game.columns),
                ];
                game.lock = false;
                io.to(`Game${data.gameId}`).emit("roundStart", {
                  id: data.gameId,
                  round: ++game.currentRound,
                  position: game.position,
                });
              });
            } else {
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

              io.to(`Game${data.gameId}`).emit("gameEnd", {
                ...game,
                statistics,
                winner: { ...statistics[winner.id], id: winner.id },
              });
              db.game = reset();
            }

            break;
          default:
            return callback({
              status: "fail",
              reason: "No event was sent",
            });
        }

        callback({
          status: "ok",
        });
      } catch (e) {
        console.log(e);
        callback({
          status: "fail",
        });
      }
    });

    socket.on("disconnecting", () => {
      if (db.game.currentPlayers.includes(socket.id)) {
        db.game = reset();
      }
    });
  });
