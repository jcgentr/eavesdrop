window.clientIds = [];
window.latitude = null;
window.longitude = null;

import { Cartesian3, Color, Math as CesiumMath } from "cesium";
import "./index.css";
import { getBroadcastingClients } from "./scripts/api";
import { cesiumClient } from "./scripts/cesiumjs";

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false, // Set to false to test without high accuracy
      maximumAge: 60000, // Increase maximumAge to allow for cached positions
      timeout: 27000, // Increase or decrease the timeout value
    });
  });
}

(async function main() {
  // first get all clients currently broadcasting
  const broadcastingClients = await getBroadcastingClients();
  // show them on the globe and make them clickable
  broadcastingClients.forEach((clientData) => {
    cesiumClient.addBroadcastingClientToCesiumGlobe(clientData);
  });

  try {
    const position = await getCurrentPosition();
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

    cesiumClient.entities.add({
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
    cesiumClient.viewer.camera.flyTo({
      destination: userLocation,
      orientation: {
        heading: CesiumMath.toRadians(0.0), // East, default value
        pitch: CesiumMath.toRadians(-90.0), // Directly looking down
        roll: 0.0, // No roll
      },
      duration: 2, // Duration in seconds
    });
  } catch (positionError) {
    console.log("could not get position =(");
    console.log(positionError);
  }
})();

// socket.io established by displayHelper import
// displayHelper setup by importing showStreamingContent here
// probably need to improve this
