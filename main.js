window.clientIds = [];
window.latitude = null;
window.longitude = null;
window.streamStatus = null;

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
import "./index.css";
import { getBroadcastingClients } from "./scripts/api";
import {
  entities,
  setupEntityClickHandler,
  setupEntityMouseOverHandler,
  viewer,
} from "./scripts/cesiumjs";
import { peer } from "./scripts/peerjs";
import { showStreamingContent } from "./scripts/displayHelpers";

const broadcastingClients = await getBroadcastingClients();

broadcastingClients.map((clientData) => {
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
