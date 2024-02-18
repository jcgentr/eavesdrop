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

// create new Peer with minimum length of 4 chars for peer ID
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
// attach peer to global window
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
  document.getElementById(
    "clientId"
  ).textContent = `Your device ID is: ${peer.id}`;
  getClients();
});

const audioContainer = document.getElementById("callContainer");
console.log(audioContainer);

// Displays the call button and peer ID
function showCallContent() {
  // window.caststatus.textContent = `Your device ID is: ${peer.id}`;
  callBtn.hidden = false;
  audioContainer.hidden = true;
}

// Displays the audio controls and correct copy
function showConnectedContent() {
  document.getElementById("callStatus").textContent = "You're connected";
  callBtn.hidden = true;
  audioContainer.hidden = false;
}

// let code;

// function getStreamCode() {
//   code = window.prompt("Please enter the sharing code");
// }

// let conn1; // caller of the call

// function connectPeers() {
//   conn1 = peer.connect(code);
//   console.log("connect peers: ", conn1);
// }

// let conn2; // receiver of the call

// peer.on("connection", (connection) => {
//   conn2 = connection;
//   console.log("connection: ", conn2);
// });

// callBtn.addEventListener("click", () => {
//   getStreamCode();
//   connectPeers();
//   const call = peer.call(code, window.localStream);

//   call.on("stream", (stream) => {
//     window.remoteAudio.srcObject = stream;
//     window.remoteAudio.autoplay = true;
//     window.peerStream = stream;
//     showConnectedContent();
//   });
// });

// peer.on("call", (call) => {
//   const answerCall = confirm("Do you want to answer?");

//   conn1?.on("close", () => {
//     showCallContent();
//   });

//   conn2?.on("close", () => {
//     showCallContent();
//   });

//   if (answerCall) {
//     call.answer(window.localStream);
//     showConnectedContent();
//     call.on("stream", (stream) => {
//       window.remoteAudio.srcObject = stream;
//       window.remoteAudio.autoplay = true;
//       window.peerStream = stream;
//     });
//   } else {
//     console.log("call denied");
//   }
// });

const hangUpBtn = document.querySelector(".hangup-btn");

hangUpBtn.addEventListener("click", () => {
  conn1?.close();
  conn2?.close();
  showCallContent();
});

Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ODBhZDdmMS00OWJhLTQwYjUtODk4OS02YTQ2MzY0YWY5ODkiLCJpZCI6MTYyODk3LCJpYXQiOjE2OTMxNzA5Nzh9.C0vBrPyP2bX_dBs480p0zqQDR8NE458oj1zGB-693fk";

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Cesium.Viewer("cesiumContainer", {
  baseLayer: Cesium.ImageryLayer.fromWorldImagery({
    style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS,
  }),
  baseLayerPicker: false,
});

const entities = viewer.entities;

navigator.geolocation.getCurrentPosition(
  (position) => {
    const userLocation = Cesium.Cartesian3.fromDegrees(
      position.coords.longitude,
      position.coords.latitude,
      10000000
    );

    entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        position.coords.longitude,
        position.coords.latitude
      ),
      billboard: {
        image: "./map-marker.svg",
        scale: 0.3,
      },
    });

    // Spin the globe to the user's location
    viewer.camera.flyTo({
      destination: userLocation,
      orientation: {
        heading: Cesium.Math.toRadians(0.0), // East, default value
        pitch: Cesium.Math.toRadians(-90.0), // Directly looking down
        roll: 0.0, // No roll
      },
      duration: 2, // Duration in seconds
    });
  },
  (positionError) => console.error(positionError)
);

var socket = io();

socket.on("clientIds", function (clientIds) {
  console.log("new clientIds", clientIds);
  window.clientIds = clientIds;
});

socket.on("broadcast-client", (clientData) => {
  // if current peer, ignore
  if (clientData.clientId === peer.id) return;
  // change lat and long for testing purposes
  const randomOffset = () => (Math.random() - 0.5) * 10;
  entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      clientData.long + randomOffset(),
      clientData.lat + randomOffset()
    ),
    point: {
      pixelSize: 24,
      color: Cesium.Color.GREEN,
    },
  });
});

const callBtn = document.querySelector(".call-btn");

callBtn.addEventListener("click", () => {
  console.log(window.latitude, window.longitude);
  socket.emit("broadcast-client", {
    clientId: peer.id,
    lat: window.latitude,
    long: window.longitude,
  });
});
