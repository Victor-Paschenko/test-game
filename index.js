const express = require("express");
var jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const initIo = require("./src/socket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

const PORT = 4000;

initIo(io);

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
