const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const { ExpressPeerServer } = require("peer");

const server = http.createServer(app);
const port = process.env.PORT || "8000";

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/myapp",
});

peerServer.on("connection", (client) => {
  console.log(`client ${client.id} connected`);
});

peerServer.on("disconnect", (client) => {
  console.log(`client ${client.id} disconnected`);
});

app.use(express.static(path.join(__dirname)));

app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/index.html`);
});

app.use("/peerjs", peerServer);

server.listen(port);
console.log(`Listening at: http://localhost:${port}`);
