import { peer } from "./peerjs";
import { socket } from "./socketio";

const audioContainer = document.getElementById("callContainer");
const hangUpBtn = document.querySelector(".hangup-btn");
// this is the user streaming their conversation
const callBtn = document.querySelector(".call-btn");
let currentCall;

export function closeCurrentCall() {
  if (currentCall) {
    currentCall.close();
    currentCall = null;
  }
}

// Displays the call button and peer ID
export function showCallContent() {
  document.getElementById("callStatus").textContent =
    "You are not currently streaming";
  callBtn.hidden = false;
  audioContainer.hidden = true;
}

// Displays the audio controls and correct copy
export function showStreamingContent({ isStreamer = true }) {
  hangUpBtn.textContent = isStreamer ? "Stop streaming" : "Stop listening";
  document.getElementById("callStatus").textContent = `You are currently ${
    isStreamer ? "streaming" : "listening"
  }.`;
  callBtn.hidden = true;
  audioContainer.hidden = false;
}

hangUpBtn.addEventListener("click", () => {
  // close p2p connection, but keep peerId
  if (currentCall) {
    currentCall.close();
    currentCall = null;
  }

  // Stop all tracks of the local stream to turn off the microphone
  if (window.localStream) {
    window.localStream.getTracks().forEach((track) => track.stop());
  }

  // Only emit stop-broadcast if the user is the broadcaster
  if (window.isBroadcasting) {
    socket.emit("stop-broadcast", { clientId: peer.id });
    window.isBroadcasting = false; // Reset the broadcasting flag
  }

  showCallContent();
});

callBtn.addEventListener("click", async () => {
  console.log(window.latitude, window.longitude);

  socket.emit("broadcast-client", {
    clientId: peer.id,
    lat: window.latitude,
    long: window.longitude,
  });

  showStreamingContent({ isStreamer: true });

  document.getElementById("remoteAudioWrapper").style.display = "none";
  document.getElementById("localAudioWrapper").style.display = "block";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    // localAudio allows them to hear themselves
    window.localStream = stream;
    window.localAudio.srcObject = stream;
    window.localAudio.autoplay = true;
    window.streamStatus = "localStreaming";
    // Set the flag to indicate that this user is broadcasting
    window.isBroadcasting = true;
  } catch (err) {
    console.log("Failed to get local stream", err);
  }

  // setup receiving call
  peer.on("call", async (call) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      // localAudio allows them to hear themselves
      window.localStream = stream;
      window.localAudio.srcObject = stream;
      window.localAudio.autoplay = true;

      call.answer(window.localStream); // Answer the call with an audio stream.
      currentCall = call;
      call.on("stream", (remoteStream) => {
        console.log(remoteStream);
        window.peerStream = remoteStream;
        window.streamStatus = "remoteStreaming";
      });
    } catch (err) {
      console.log("Failed to get local stream", err);
    }
  });
});
