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
import { peerClient } from "./peerjs";

class CesiumClient {
  constructor() {
    // Your access token can be found at: https://ion.cesium.com/tokens.
    // This is the default access token from your ion account
    Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYTZmYjQxYi04ZDhhLTQ1NTQtYThhYy1jOTdhNWRmZTU3MmYiLCJpZCI6MTYyODk3LCJpYXQiOjE3MDg2MTQzNDN9.tJSlF71XoFHJyQNsDLHQbqeTjpbyRGCVeXvWFaTQaPQ";

    // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
    this.viewer = new Viewer("cesiumContainer", {
      baseLayer: ImageryLayer.fromWorldImagery({
        style: IonWorldImageryStyle.AERIAL_WITH_LABELS,
      }),
      baseLayerPicker: false,
      vrButton: false,
      homeButton: false,
      geocoder: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
    });

    this.entities = this.viewer.entities;
  }

  setupEntityClickHandler(entity, clientData) {
    this.viewer.screenSpaceEventHandler.setInputAction((click) => {
      const pickedObject = this.viewer.scene.pick(click.position);

      if (window.isBroadcasting) return alert("Stop streaming first!");

      if (defined(pickedObject) && pickedObject.id === entity) {
        peerClient.streamCall(clientData, pickedObject);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
  }

  setupEntityMouseOverHandler(entity) {
    this.viewer.screenSpaceEventHandler.setInputAction((movement) => {
      const pickedObject = this.viewer.scene.pick(movement.endPosition);
      if (defined(pickedObject) && pickedObject.id === entity) {
        this.viewer.canvas.style.cursor = "pointer";
      } else {
        this.viewer.canvas.style.cursor = "default";
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);
  }

  addBroadcastingClientToCesiumGlobe(clientData) {
    const newEntity = this.entities.add({
      id: clientData.clientId,
      position: Cartesian3.fromDegrees(clientData.long, clientData.lat),
      point: {
        pixelSize: 24,
        color: Color.YELLOW,
      },
    });

    this.setupEntityClickHandler(newEntity, clientData);
    this.setupEntityMouseOverHandler(newEntity);
  }

  removeBroadcastingClientFromCesiumGlobe(clientId) {
    const entityToRemove = this.entities.getById(clientId);
    if (defined(entityToRemove)) {
      this.entities.remove(entityToRemove);
    }
  }
}

export const cesiumClient = new CesiumClient();
