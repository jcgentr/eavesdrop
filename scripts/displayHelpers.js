import { peer } from "./peerjs";
import { socket } from "./socketio";

const audioContainer = document.getElementById("callContainer");
const hangUpBtn = document.querySelector(".hangup-btn");
// this is the user streaming their conversation
const callBtn = document.querySelector(".call-btn");

// Displays the call button and peer ID
export function showCallContent() {
  document.getElementById("callStatus").textContent =
    "You are not currently streaming";
  callBtn.hidden = false;
  audioContainer.hidden = true;
}

// Displays the audio controls and correct copy
export function showStreamingContent() {
  document.getElementById("callStatus").textContent =
    "You are currently streaming";
  callBtn.hidden = true;
  audioContainer.hidden = false;
}

hangUpBtn.addEventListener("click", () => {
  peer.destroy();
  showCallContent();
});

callBtn.addEventListener("click", () => {
  console.log(window.latitude, window.longitude);

  socket.emit("broadcast-client", {
    clientId: peer.id,
    lat: window.latitude,
    long: window.longitude,
  });

  showStreamingContent();

  document.getElementById("remoteAudioWrapper").style.display = "none";

  const getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  getUserMedia(
    { video: false, audio: true },
    (stream) => {
      // localAudio allows them to hear themselves
      window.localStream = stream;
      window.localAudio.srcObject = stream;
      window.localAudio.autoplay = true;
      window.streamStatus = "localStreaming";
    },
    (err) => {
      console.log("Failed to get local stream", err);
    }
  );

  // setup receiving call
  peer.on("call", (call) => {
    getUserMedia(
      { video: false, audio: true },
      (stream) => {
        // localAudio allows them to hear themselves
        window.localStream = stream;
        window.localAudio.srcObject = stream;
        window.localAudio.autoplay = true;

        call.answer(window.localStream); // Answer the call with an audio stream.

        call.on("stream", (remoteStream) => {
          console.log(remoteStream);
          window.peerStream = remoteStream;
          window.streamStatus = "remoteStreaming";
        });
      },
      (err) => {
        console.log("Failed to get local stream", err);
      }
    );
  });
});
