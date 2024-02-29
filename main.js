window.clientIds = [];
window.latitude = null;
window.longitude = null;
window.streamStatus = null;

import { Cartesian3, Color, Math as CesiumMath } from "cesium";
import "./index.css";
import { getBroadcastingClients } from "./scripts/api";
import {
  addBroadcastingClientToCesiumGlobe,
  entities,
  viewer,
} from "./scripts/cesiumjs";

// first get all clients currently broadcasting
const broadcastingClients = await getBroadcastingClients();
// show them on the globe and make them clickable
broadcastingClients.map((clientData) => {
  addBroadcastingClientToCesiumGlobe(clientData);
});
// now let's try to get user's location
// Dummy one, which will result in a working next statement (hopefully).
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

// socket.io established by displayHelper import
// displayHelper setup by importing showStreamingContent here
// probably need to improve this
