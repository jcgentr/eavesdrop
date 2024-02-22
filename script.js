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

peer.on("open", () => {
  document.getElementById(
    "clientId"
  ).textContent = `Your device ID is: ${peer.id}`;
  getClients();
});

const audioContainer = document.getElementById("callContainer");

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

let p2pConnection;

function connectPeers(clientId) {
  console.log("trying to connect to ", clientId);
  p2pConnection = peer.connect(clientId);
  console.log("connected peers: ", p2pConnection);

  p2pConnection.on("open", () => {
    // here you have conn.id
    console.log("p2p connection open");
    p2pConnection.send("hi!");
  });
}

peer.on("connection", (conn) => {
  conn.on("data", (data) => {
    // Will print 'hi!'
    console.log(data);
  });
});

const hangUpBtn = document.querySelector(".hangup-btn");

hangUpBtn.addEventListener("click", () => {
  conn1?.close();
  conn2?.close();
  showCallContent();
});

Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYTZmYjQxYi04ZDhhLTQ1NTQtYThhYy1jOTdhNWRmZTU3MmYiLCJpZCI6MTYyODk3LCJpYXQiOjE3MDg2MTQzNDN9.tJSlF71XoFHJyQNsDLHQbqeTjpbyRGCVeXvWFaTQaPQ";

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
    console.log(
      "found location: ",
      position.coords.longitude,
      position.coords.latitude
    );
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
  (positionError) => {
    console.log("could not get position =(");
    console.log(positionError);
  },
  {
    enableHighAccuracy: false, // Set to false to test without high accuracy
    maximumAge: 60000, // Increase maximumAge to allow for cached positions
    timeout: 27000, // Increase or decrease the timeout value
  }
);

var socket = io();

socket.on("clientIds", function (clientIds) {
  console.log("new clientIds", clientIds);
  window.clientIds = clientIds;
});

socket.on("broadcast-client", (clientData) => {
  // if current peer, ignore
  if (clientData.clientId === peer.id) return;
  // change lat and long for TESTING PURPOSES ONLY
  const randomOffset = () => (Math.random() - 0.5) * 10;
  const newEntity = entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      clientData.long + randomOffset(),
      clientData.lat + randomOffset()
    ),
    point: {
      pixelSize: 24,
      color: Cesium.Color.GREEN,
    },
  });
  // Set up an event handler for the left click
  // this is the user eavesdropping on cnoversation
  viewer.screenSpaceEventHandler.setInputAction((click) => {
    const pickedObject = viewer.scene.pick(click.position);
    if (Cesium.defined(pickedObject) && pickedObject.id === newEntity) {
      // The entity was clicked, add your logic here
      console.log("Entity clicked:", pickedObject.id);
      // Perform any additional actions here
      const peerId = clientData.clientId;
      console.log(peerId);
      connectPeers(peerId);
      // Create a silent audio track
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const dst = audioContext.createMediaStreamDestination();
      oscillator.connect(dst);
      oscillator.start();
      const track = dst.stream.getAudioTracks()[0];

      // Create a new stream with the silent audio track
      const silentStream = new MediaStream([track]);

      // Use the silent stream for the call
      const call = peer.call(peerId, silentStream);

      call.on("stream", (remoteStream) => {
        // Show stream in some video/canvas element.
        console.log(remoteStream);
        showConnectedContent();
        window.remoteAudio.srcObject = remoteStream;
        window.remoteAudio.autoplay = true;
        window.peerStream = remoteStream;
      });
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // Set up an event handler for mouse movement
  viewer.screenSpaceEventHandler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.endPosition);
    if (Cesium.defined(pickedObject) && pickedObject.id === newEntity) {
      // Change the cursor style to pointer
      viewer.canvas.style.cursor = "pointer";
    } else {
      // Change the cursor style back to default
      viewer.canvas.style.cursor = "default";
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
});

// this is the user streaming their conversation
const callBtn = document.querySelector(".call-btn");

callBtn.addEventListener("click", () => {
  console.log(window.latitude, window.longitude);

  socket.emit("broadcast-client", {
    clientId: peer.id,
    lat: window.latitude,
    long: window.longitude,
  });

  const getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
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
          showConnectedContent();
          window.peerStream = remoteStream;
        });
      },
      (err) => {
        console.log("Failed to get local stream", err);
      }
    );
  });
});
