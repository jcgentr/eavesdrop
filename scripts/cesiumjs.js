import {
  Cartesian3,
  Ion,
  Viewer,
  ImageryLayer,
  IonWorldImageryStyle,
  defined,
  ScreenSpaceEventType,
  Color,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { streamCall } from "./peerjs";

// Your access token can be found at: https://ion.cesium.com/tokens.
// This is the default access token from your ion account
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYTZmYjQxYi04ZDhhLTQ1NTQtYThhYy1jOTdhNWRmZTU3MmYiLCJpZCI6MTYyODk3LCJpYXQiOjE3MDg2MTQzNDN9.tJSlF71XoFHJyQNsDLHQbqeTjpbyRGCVeXvWFaTQaPQ";

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
export const viewer = new Viewer("cesiumContainer", {
  baseLayer: ImageryLayer.fromWorldImagery({
    style: IonWorldImageryStyle.AERIAL_WITH_LABELS,
  }),
  baseLayerPicker: false,
});

export const entities = viewer.entities;

export function setupEntityClickHandler(entity, clientData) {
  viewer.screenSpaceEventHandler.setInputAction((click) => {
    const pickedObject = viewer.scene.pick(click.position);
    if (defined(pickedObject) && pickedObject.id === entity) {
      streamCall(clientData, pickedObject);
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
}

export function setupEntityMouseOverHandler(entity) {
  viewer.screenSpaceEventHandler.setInputAction((movement) => {
    const pickedObject = viewer.scene.pick(movement.endPosition);
    if (defined(pickedObject) && pickedObject.id === entity) {
      viewer.canvas.style.cursor = "pointer";
    } else {
      viewer.canvas.style.cursor = "default";
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);
}

export function addBroadcastingClientToCesiumGlobe(clientData) {
  const newEntity = entities.add({
    id: clientData.clientId,
    position: Cartesian3.fromDegrees(clientData.long, clientData.lat),
    point: {
      pixelSize: 24,
      color: Color.YELLOW,
    },
  });

  setupEntityClickHandler(newEntity, clientData);
  setupEntityMouseOverHandler(newEntity);
}

export function removeBroadcastingClientFromCesiumGlobe(clientId) {
  const entityToRemove = entities.getById(clientId);
  if (defined(entityToRemove)) {
    entities.remove(entityToRemove);
  }
}
