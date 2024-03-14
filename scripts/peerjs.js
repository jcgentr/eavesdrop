import { Peer } from "peerjs";
import { showStreamingContent } from "./displayHelpers";
import { v4 as uuidv4 } from "uuid";

class PeerClient {
  constructor() {
    this.peer = new Peer(uuidv4(), {
      host:
        process.env.NODE_ENV === "production"
          ? "eavesdrop.fly.dev"
          : "localhost",
      port: process.env.NODE_ENV === "production" ? 443 : 3000,
      path: "/peerjs/myapp",
      secure: process.env.NODE_ENV === "production",
    });
    this.p2pConnection = null;
    this.currentCall = null;
    this.setupPeerEvents();
  }

  setupPeerEvents() {
    this.peer.on("open", () => {
      document.getElementById(
        "clientId"
      ).textContent = `Your device ID is: ${this.peer.id}`;
    });

    this.peer.on("connection", (conn) => {
      conn.on("data", (data) => {
        console.log(data);
      });
    });

    this.peer.on("close", () => {
      console.log(`peer ${this.peer.id} has been destroyed`);
    });

    // setup receiving call from the listener peer
    this.peer.on("call", async (call) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        // localAudio allows them to hear themselves
        window.localStream = stream;
        window.localAudio.srcObject = stream;
        window.localAudio.autoplay = true;

        this.currentCall = call;

        call.answer(window.localStream); // Answer the call with an audio stream.

        call.on("stream", (remoteStream) => {
          console.log(remoteStream);
          window.peerStream = remoteStream;
        });
      } catch (err) {
        console.log("Failed to get local stream", err);
      }
    });
  }

  // connect this listener to the streamer via their id
  connectPeers(clientId) {
    console.log("trying to connect to ", clientId);
    this.p2pConnection = this.peer.connect(clientId);
    console.log("connected peers: ", this.p2pConnection);

    this.p2pConnection.on("open", () => {
      console.log("p2p connection open");
      this.p2pConnection.send("hi!");
    });
  }

  // user is trying to listen to a conversation
  streamCall(clientData, pickedObject) {
    this.closeCurrentCall();
    console.log("Entity clicked:", pickedObject.id);
    const peerId = clientData.clientId;

    console.log(peerId);
    this.connectPeers(peerId);

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const dst = audioContext.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();

    const track = dst.stream.getAudioTracks()[0];
    const silentStream = new MediaStream([track]);
    const call = this.peer.call(peerId, silentStream);

    this.currentCall = call;

    call.on("stream", (remoteStream) => {
      console.log(remoteStream);

      document.getElementById("remoteAudioWrapper").style.display = "block";
      document.getElementById("localAudioWrapper").style.display = "none";

      showStreamingContent({ isStreamer: false });

      window.remoteAudio.srcObject = remoteStream;
      window.remoteAudio.autoplay = true;
      window.peerStream = remoteStream;
    });
  }

  closeCurrentCall() {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }
    if (this.p2pConnection) {
      this.p2pConnection.close();
      this.p2pConnection = null;
    }
  }
}

export const peerClient = new PeerClient();
