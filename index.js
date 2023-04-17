const express = require("express");
var jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const initIo = require("./socket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.1.42:3000"],
    methods: ["GET", "POST"],
  },
});

const PORT = 4000;

initIo(io);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broken!");
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
