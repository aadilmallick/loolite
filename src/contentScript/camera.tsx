import { WebAccessibleResources } from "../chrome-api/webAccessibleResources";
import { NavigatorPermissions } from "../offscreen/NavigatorPermissions";
import { ToastManager } from "../options/Toast";
import {
  html,
  DOM,
  css,
  throttle,
  CSSVariablesManagerWithDefaultData,
} from "../utils/Dom";
import { ContentScriptUI } from "../utils/web-components/ContentScriptUI";
import { Draggable, DragMoveEvent } from "@shopify/draggable";

const manager = new ToastManager({
  position: "bottom-left",
});

function lerp(options: {
  currentPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  callback: (currentPos: { x: number; y: number }) => void;
  lerpFactor?: number;
}) {
  const distanceX = options.targetPos.x - options.currentPos.x;
  const distanceY = options.targetPos.y - options.currentPos.y;

  // we need these checks, otherwise loops infinitely
  if (Math.abs(distanceX) < 1 || Math.abs(distanceY) < 1) return;

  // the smaller the percentage, the slower the animation
  // right now we are moving half the distance
  const lerpFactor = options.lerpFactor || 0.5;
  options.currentPos.x += distanceX * lerpFactor;
  options.currentPos.y += distanceY * lerpFactor;
  // set this -> transform: translate(var(--x), var(--y))
  options.callback(options.currentPos);
  // recursive requestAnimationFrame
  requestAnimationFrame(() => lerp(options));
}

/**
 *
 *
 * When world = MAIN, custom elements is defined, but chrome.runtime is not, but when world = ISOLATED, custom elements is undefined but chrome.runtime is defined
 */

const CONSTANTS = {
  GROWTH_FACTOR: 50,
  MAX_SIZE: 600,
  MIN_SIZE: 150,
};

function create() {
  const iframeSrc = WebAccessibleResources.getFileURIForContent("video.html");
  console.log("iframeSrc", iframeSrc);
  if (!iframeSrc) {
    manager.danger("iframeSrc is not defined");
    throw new Error("iframeSrc is not defined");
  }

  const coordinates = {
    x: 0,
    y: 0,
    mouseDown: false,
  };
  const videoFrame = ContentScriptUI.manualCreation(iframeSrc);
  const iframeContainer = videoFrame.querySelector(
    "#camera-iframe-container"
  ) as HTMLElement;
  const variablesManager = new CSSVariablesManagerWithDefaultData(
    iframeContainer,
    {
      cameraSize: "200px",
      size: 200,
    }
  );
  coordinates.x = iframeContainer.getBoundingClientRect().x;
  coordinates.y = iframeContainer.getBoundingClientRect().y;
  console.log("coordinates", coordinates);

  iframeContainer.addEventListener("mousedown", (e) => {
    console.log("mouse down");
    coordinates.mouseDown = true;
  });

  iframeContainer.addEventListener("dblclick", (e) => {
    console.log("dblclick");
    const size = Number(variablesManager.get("size"));
    let newSize = size + CONSTANTS.GROWTH_FACTOR;
    if (size >= CONSTANTS.MAX_SIZE || size >= window.innerWidth - 100) {
      newSize = CONSTANTS.MIN_SIZE;
    }
    variablesManager.set("cameraSize", `${newSize}px`);
    variablesManager.set("size", newSize);
  });

  iframeContainer.addEventListener("mouseup", (e) => {
    coordinates.mouseDown = false;
  });

  document.addEventListener(
    "mousemove",
    throttle((e) => {
      if (coordinates.mouseDown) {
        coordinates.x = e.clientX;
        coordinates.y = e.clientY;
        const newX =
          coordinates.x -
          Math.floor(iframeContainer.getBoundingClientRect().width / 2);
        const newY =
          coordinates.y -
          Math.floor(iframeContainer.getBoundingClientRect().height / 2);
        iframeContainer.style.left = `${newX}px`;
        iframeContainer.style.top = `${newY}px`;
      }
    }, 50)
  );

  // const draggable = new Draggable(videoFrame, {
  //   draggable: "#camera-iframe-container",
  //   mirror: {
  //     // constrainDimensions: true,
  //     appendTo: "#placeholder",
  //   },
  // });

  // draggable.on("drag:start", (e) => {
  //   console.count("on drag start");
  // });

  // const onDragMove = throttle((e: DragMoveEvent) => {
  //   console.count("on drag move");

  //   const { source } = e;
  //   const boundingBox = source.getBoundingClientRect();
  //   const prevCoordinates = { ...coordinates };
  //   //   if (e.sensorEvent.clientX < 0) {
  //   //     coordinates.x = 0;
  //   //   }
  //   //   if (e.sensorEvent.clientY < 0) {
  //   //     coordinates.y = 0;
  //   //   }
  //   //   if (e.sensorEvent.clientX - boundingBox.width > window.innerWidth) {
  //   //     coordinates.x = window.innerWidth - boundingBox.width;
  //   //   }
  //   //   if (e.sensorEvent.clientY - boundingBox.height > window.innerHeight) {
  //   //     coordinates.y = window.innerHeight - boundingBox.height;
  //   //   } else {
  //   //     coordinates.x = e.sensorEvent.clientX;
  //   //     coordinates.y = e.sensorEvent.clientY;
  //   //   }
  //   //   console.log(coordinates);
  //   coordinates.x = e.sensorEvent.clientX;
  //   coordinates.y = e.sensorEvent.clientY;
  //   // lerp({
  //   //   currentPos: {
  //   //     x: prevCoordinates.x,
  //   //     y: prevCoordinates.y,
  //   //   },
  //   //   targetPos: {
  //   //     x: coordinates.x,
  //   //     y: coordinates.y,
  //   //   },
  //   //   callback: (currentPos) => {
  //   //     source.style.left = `${currentPos.x}px`;
  //   //     source.style.top = `${currentPos.y}px`;
  //   //   },
  //   //   lerpFactor: 0.8,
  //   // });
  //   source.style.left = `${coordinates.x}px`;
  //   source.style.top = `${coordinates.y}px`;
  // }, 15);

  // draggable.on("drag:stop", (e) => {
  //   //   e.sensorEvent.clientX
  //   const { originalSource } = e;
  //   originalSource.style.left = `${coordinates.x}px`;
  //   originalSource.style.top = `${coordinates.y}px`;
  // });

  // draggable.on("drag:move", onDragMove);

  document.body.style.overflowX = "hidden";
}

console.log(
  "%c has element",
  document.querySelector("#camera-iframe-container"),
  "color:blue;"
);
if (!document.querySelector("#camera-iframe-container")) {
  create();
}
