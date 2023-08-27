const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const { Server } = require("socket.io");
const { ExpressPeerServer } = require("peer");

const server = http.createServer(app);
const port = process.env.PORT || "8000";

const io = new Server(server);

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/myapp",
});

let clientIds = [];

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

peerServer.on("connection", (client) => {
  console.log(`client ${client.id} connected`);
  clientIds.push(client.id);
  io.emit("clientIds", clientIds);
});

peerServer.on("disconnect", (client) => {
  console.log(`client ${client.id} disconnected`);
  clientIds = clientIds.filter((id) => id !== client.id);
  io.emit("clientIds", clientIds);
});

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.get("/clients", (req, res) => {
  res.json(clientIds);
});

app.use("/peerjs", peerServer);

server.listen(port, () => {
  console.log(`Listening at: http://localhost:${port}`);
});
