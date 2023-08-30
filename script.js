window.clientIds = [];
window.latitude = null;
window.longitude = null;

function geoFindMe() {
  function success(position) {
    window.latitude = position.coords.latitude;
    window.longitude = position.coords.longitude;

    console.log(
      `Latitude: ${window.latitude} °, Longitude: ${window.longitude} °`
    );
  }

  function error() {
    console.log("Unable to retrieve your location");
  }

  if (!navigator.geolocation) {
    console.log("Geolocation is not supported by your browser");
  } else {
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

function getClients() {
  const clientsElem = document.querySelector(".clients");
  // TODO: send lat and long as query parameters
  geoFindMe();
  const url = `/clients?lat=${window.latitude}&long=${window.longitude}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      window.clientIds = data;
      console.log(window.clientIds);
    });
}

const peer = new Peer(
  `${Math.floor(Math.random() * 2 ** 18)
    .toString(36)
    .padStart(4, 0)}`,
  {
    host: "localhost",
    port: 8000,
    path: "peerjs/myapp",
  }
);

window.peer = peer;

// Gets the local audio stream of the current caller
function getLocalStream() {
  navigator.mediaDevices
    .getUserMedia({ video: false, audio: true })
    .then((stream) => {
      window.localStream = stream; // A
      window.localAudio.srcObject = stream; // B
      window.localAudio.autoplay = true; // C
    })
    .catch((err) => {
      console.error(`you got an error: ${err}`);
    });
}

getLocalStream();

peer.on("open", () => {
  // window.caststatus.textContent = `Your device ID is: ${peer.id}`;
  getClients();
});

const audioContainer = document.querySelector(".call-container");

// Displays the call button and peer ID
function showCallContent() {
  window.caststatus.textContent = `Your device ID is: ${peer.id}`;
  callBtn.hidden = false;
  audioContainer.hidden = true;
}

// Displays the audio controls and correct copy
function showConnectedContent() {
  window.caststatus.textContent = "You're connected";
  callBtn.hidden = true;
  audioContainer.hidden = false;
}

let code;

function getStreamCode() {
  code = window.prompt("Please enter the sharing code");
}

let conn1; // caller of the call

function connectPeers() {
  conn1 = peer.connect(code);
  console.log("connect peers: ", conn1);
}

let conn2; // receiver of the call

peer.on("connection", (connection) => {
  conn2 = connection;
  console.log("connection: ", conn2);
});

const callBtn = document.querySelector(".call-btn");

callBtn.addEventListener("click", () => {
  getStreamCode();
  connectPeers();
  const call = peer.call(code, window.localStream);

  call.on("stream", (stream) => {
    window.remoteAudio.srcObject = stream;
    window.remoteAudio.autoplay = true;
    window.peerStream = stream;
    showConnectedContent();
  });
});

peer.on("call", (call) => {
  const answerCall = confirm("Do you want to answer?");

  conn1?.on("close", () => {
    showCallContent();
  });

  conn2?.on("close", () => {
    showCallContent();
  });

  if (answerCall) {
    call.answer(window.localStream);
    showConnectedContent();
    call.on("stream", (stream) => {
      window.remoteAudio.srcObject = stream;
      window.remoteAudio.autoplay = true;
      window.peerStream = stream;
    });
  } else {
    console.log("call denied");
  }
});

const hangUpBtn = document.querySelector(".hangup-btn");

hangUpBtn.addEventListener("click", () => {
  conn1?.close();
  conn2?.close();
  showCallContent();
});
