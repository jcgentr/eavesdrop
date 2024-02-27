window.clientIds = [];
window.latitude = null;
window.longitude = null;
window.streamStatus = null;

import { io } from "socket.io-client";
import { Peer } from "peerjs";
import {
  Cartesian3,
  createOsmBuildingsAsync,
  Ion,
  Terrain,
  Viewer,
  ImageryLayer,
  IonWorldImageryStyle,
  defined,
  ScreenSpaceEventType,
  Color,
  Math as CesiumMath,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./index.css";

// Your access token can be found at: https://ion.cesium.com/tokens.
// This is the default access token from your ion account
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYTZmYjQxYi04ZDhhLTQ1NTQtYThhYy1jOTdhNWRmZTU3MmYiLCJpZCI6MTYyODk3LCJpYXQiOjE3MDg2MTQzNDN9.tJSlF71XoFHJyQNsDLHQbqeTjpbyRGCVeXvWFaTQaPQ";

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("cesiumContainer", {
  baseLayer: ImageryLayer.fromWorldImagery({
    style: IonWorldImageryStyle.AERIAL_WITH_LABELS,
  }),
  baseLayerPicker: false,
});

const entities = viewer.entities;

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
});

const audioContainer = document.getElementById("callContainer");

// Displays the call button and peer ID
function showCallContent() {
  document.getElementById("callStatus").textContent =
    "You are not currently streaming";
  callBtn.hidden = false;
  audioContainer.hidden = true;
}

// Displays the audio controls and correct copy
function showStreamingContent() {
  document.getElementById("callStatus").textContent =
    "You are currently streaming";
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
  peer.destroy();
  showCallContent();
});

function setupEntityClickHandler(entity, clientData) {
  viewer.screenSpaceEventHandler.setInputAction((click) => {
    const pickedObject = viewer.scene.pick(click.position);
    if (defined(pickedObject) && pickedObject.id === entity) {
      console.log("Entity clicked:", pickedObject.id);
      const peerId = clientData.clientId;
      console.log(peerId);
      connectPeers(peerId);
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
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
  }, ScreenSpaceEventType.LEFT_CLICK);
}

function setupEntityMouseOverHandler(entity) {
  viewer.screenSpaceEventHandler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.endPosition);
    if (defined(pickedObject) && pickedObject.id === entity) {
      viewer.canvas.style.cursor = "pointer";
    } else {
      viewer.canvas.style.cursor = "default";
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);
}

function getBroadcastingClients() {
  return fetch("/clients")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => data)
    .catch((error) => {
      console.error("Error fetching client data:", error);
      return [];
    });
}

getBroadcastingClients().then((data) => {
  if (data) {
    console.log(data.clientsBroadcasting);
    data.clientsBroadcasting.map((clientData) => {
      // change lat and long for TESTING PURPOSES ONLY
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
  }
});

//Dummy one, which will result in a working next statement.
navigator.geolocation.getCurrentPosition(
  function () {},
  function () {},
  {}
);

navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log(
      "found location: ",
      position.coords.longitude,
      position.coords.latitude
    );

    window.latitude = position.coords.latitude;
    window.longitude = position.coords.longitude;

    const userLocation = Cartesian3.fromDegrees(
      position.coords.longitude,
      position.coords.latitude,
      10000000
    );

    entities.add({
      position: Cartesian3.fromDegrees(
        position.coords.longitude,
        position.coords.latitude
      ),
      point: {
        pixelSize: 24,
        color: Color.GREEN,
      },
    });

    // Spin the globe to the user's location
    viewer.camera.flyTo({
      destination: userLocation,
      orientation: {
        heading: CesiumMath.toRadians(0.0), // East, default value
        pitch: CesiumMath.toRadians(-90.0), // Directly looking down
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
    enableHighAccuracy: true, // Set to false to test without high accuracy
    maximumAge: 10000, // Increase maximumAge to allow for cached positions
    timeout: 27000, // Increase or decrease the timeout value
  }
);

// Connect to the backend server
// In development, this will be your Vite dev server's proxy
// In production, it will be the same server that serves your static files
const socket = io(import.meta.env.DEV ? "http://localhost:8000" : "/");

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

// this is the user streaming their conversation
const callBtn = document.querySelector(".call-btn");

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
