import { Peer } from "peerjs";
import { showStreamingContent } from "./displayHelpers";

// create new Peer with minimum length of 4 chars for peer ID
export const peer = new Peer(
  `${Math.floor(Math.random() * 2 ** 18)
    .toString(36)
    .padStart(4, 0)}`,
  {
    host: "localhost",
    port: 8000,
    path: "peerjs/myapp",
  }
);
// attach peer to global window
window.peer = peer;

peer.on("open", () => {
  document.getElementById(
    "clientId"
  ).textContent = `Your device ID is: ${peer.id}`;
});

peer.on("connection", (conn) => {
  conn.on("data", (data) => {
    // Will print 'hi!'
    console.log(data);
  });
});

export function connectPeers(clientId) {
  console.log("trying to connect to ", clientId);
  const p2pConnection = peer.connect(clientId);
  console.log("connected peers: ", p2pConnection);

  p2pConnection.on("open", () => {
    // here you have conn.id
    console.log("p2p connection open");
    p2pConnection.send("hi!");
  });
}

export function streamCall(clientData, pickedObject) {
  // this stuff needs to go into peerjs helper function
  console.log("Entity clicked:", pickedObject.id);
  const peerId = clientData.clientId;

  console.log(peerId);
  connectPeers(peerId);

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const dst = audioContext.createMediaStreamDestination();
  oscillator.connect(dst);
  oscillator.start();

  const track = dst.stream.getAudioTracks()[0];
  const silentStream = new MediaStream([track]);
  const call = peer.call(peerId, silentStream);

  call.on("stream", (remoteStream) => {
    console.log(remoteStream);
    document.getElementById("localAudioWrapper").style.display = "none";
    showStreamingContent();
    window.remoteAudio.srcObject = remoteStream;
    window.remoteAudio.autoplay = true;
    window.peerStream = remoteStream;
  });
}