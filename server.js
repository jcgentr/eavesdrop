const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const app = express();
const { Server } = require("socket.io");
const { ExpressPeerServer } = require("peer");

const server = http.createServer(app);
const port = process.env.PORT || "3000";

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "development" ? "http://localhost:5173" : "*",
    methods: ["GET", "POST"],
  },
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/myapp",
});

let clientIds = [];
let clientsBroadcasting = [];

io.on("connection", (socket) => {
  console.log("a user connected (Socket.io)");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("broadcast-client", (clientData) => {
    // change lat and long for TESTING PURPOSES ONLY
    clientData.lat += (Math.random() - 0.5) * 10;
    clientData.long += (Math.random() - 0.5) * 10;
    console.log(clientData);

    // don't broadcast client if they don't have proper geolocation
    if (!clientData.lat || !clientData.long) return;
    clientsBroadcasting.push(clientData);
    io.emit("broadcast-client", clientData);
  });

  socket.on("stop-broadcast", ({ clientId }) => {
    clientsBroadcasting = clientsBroadcasting.filter(
      (client) => client.clientId !== clientId
    );
    io.emit("stop-broadcast", { clientId });
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

// Enable CORS for requests from the Vite development server
const corsOptions = {
  origin: "http://localhost:5173", // or the port where your Vite server runs
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

if (process.env.NODE_ENV === "production") {
  // Serve static files from Vite's build output directory
  app.use(express.static(path.join(__dirname, "dist")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });
}

app.get("/clients", (req, res) => {
  res.json({ clientIds, clientsBroadcasting });
});

app.use("/peerjs", peerServer);

server.listen(port, "::", () => {
  console.log(`Listening at: http://localhost:${port}`);
});
