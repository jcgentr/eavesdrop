import { io } from "socket.io-client";
import { cesiumClient } from "./cesiumjs";
import { peerClient } from "./peerjs";
import { showCallContent } from "./displayHelpers";

class SocketConnection {
  constructor() {
    const url = import.meta.env.DEV ? "http://localhost:3000" : "/";
    this.socket = io(url);

    this.socket.on("connect", () => {
      console.log("connected to socket.io server");
    });

    this.socket.on("clientIds", (clientIds) => {
      console.log("new clientIds", clientIds);
      window.clientIds = clientIds;
    });

    this.socket.on("broadcast-client", (clientData) => {
      // if current peer, ignore
      if (clientData.clientId === peerClient.peer.id) return;
      cesiumClient.addBroadcastingClientToCesiumGlobe(clientData);
    });

    this.socket.on("stop-broadcast", ({ clientId }) => {
      // if current peer, ignore
      if (clientId === peerClient.peer.id) return;
      showCallContent();
      cesiumClient.removeBroadcastingClientFromCesiumGlobe(clientId);
    });
  }
}

export const socketConnection = new SocketConnection();
