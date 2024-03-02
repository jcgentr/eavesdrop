import { io } from "socket.io-client";
import {
  addBroadcastingClientToCesiumGlobe,
  removeBroadcastingClientFromCesiumGlobe,
} from "./cesiumjs";
import { peer } from "./peerjs";
import { showCallContent } from "./displayHelpers";

// Connect to the backend server
// In development, this will be your Vite dev server's proxy
// In production, it will be the same server that serves your static files
export const socket = io(import.meta.env.DEV ? "http://localhost:3000" : "/");

socket.on("connect", () => {
  console.log("connected to socket.io server");
});

socket.on("clientIds", function (clientIds) {
  console.log("new clientIds", clientIds);
  window.clientIds = clientIds;
});

socket.on("broadcast-client", (clientData) => {
  // if current peer, ignore
  if (clientData.clientId === peer.id) return;
  addBroadcastingClientToCesiumGlobe(clientData);
});

socket.on("stop-broadcast", ({ clientId }) => {
  // if current peer, ignore
  if (clientId === peer.id) return;
  showCallContent();
  removeBroadcastingClientFromCesiumGlobe(clientId);
});
