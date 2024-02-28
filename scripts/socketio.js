import { io } from "socket.io-client";
import {
  entities,
  setupEntityClickHandler,
  setupEntityMouseOverHandler,
} from "./cesiumjs";
import { peer } from "./peerjs";
import { Cartesian3, Color } from "cesium";

// Connect to the backend server
// In development, this will be your Vite dev server's proxy
// In production, it will be the same server that serves your static files
export const socket = io(import.meta.env.DEV ? "http://localhost:8000" : "/");

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
  const newEntity = entities.add({
    position: Cartesian3.fromDegrees(clientData.long, clientData.lat),
    point: {
      pixelSize: 24,
      color: Color.YELLOW,
    },
  });

  setupEntityClickHandler(newEntity, clientData);
  setupEntityMouseOverHandler(newEntity);
});
