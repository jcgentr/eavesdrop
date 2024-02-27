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
let clientsBroadcasting = [];

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("broadcast-client", (clientData) => {
    const { clientId, lat, long } = clientData;
    console.log(clientId, lat, long);
    // don't broadcast client if they don't have proper geolocation
    if (!lat || !long) return;
    clientsBroadcasting.push(clientData);
    io.emit("broadcast-client", clientData);
  });
});

peerServer.on("connection", (client) => {
  console.log(`client ${client.id} connected`);
  // add clientId
  clientIds.push(client.id);
  io.emit("clientIds", clientIds);
});

peerServer.on("disconnect", (client) => {
  console.log(`client ${client.id} disconnected`);
  // remove clientId
  clientIds = clientIds.filter((id) => id !== client.id);
  // remove client data
  clientsBroadcasting = clientsBroadcasting.filter(
    ({ clientId }) => clientId !== client.id
  );
  io.emit("clientIds", clientIds);
});

// Serve static files from Vite's build output directory
app.use(express.static(path.join(__dirname, "dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/clients", (req, res) => {
  res.json({ clientIds, clientsBroadcasting });
});

app.use("/peerjs", peerServer);

server.listen(port, () => {
  console.log(`Listening at: http://localhost:${port}`);
});
