import { cameraStyleChannel } from "../background/controllers/messages";
import { appStorage } from "../background/controllers/storage";
import { MessagesModel } from "../chrome-api/messages";
import { WebAccessibleResources } from "../chrome-api/webAccessibleResources";
import { NavigatorPermissions } from "../offscreen/NavigatorPermissions";
import { ToastManager } from "../options/Toast";
import { BorderGradientModel } from "../utils/BorderGradient";
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

async function getStoredCoordinates() {
  const savedCoordinates = await appStorage.get("webcamCoordinates");
  console.log("savedCoordinates", savedCoordinates);
  if (savedCoordinates) {
    return {
      ...savedCoordinates,
      mouseDown: false,
    };
  } else {
    return {
      x: -1,
      y: -1,
      mouseDown: false,
    };
  }
}

async function initCoordinates(iframeContainer: HTMLElement) {
  const coordinates = await getStoredCoordinates();
  if (coordinates.x === -1 && coordinates.y === -1) {
    coordinates.x = iframeContainer.getBoundingClientRect().x;
    coordinates.y = iframeContainer.getBoundingClientRect().y;
  }
  iframeContainer.style.left = `${coordinates.x}px`;
  iframeContainer.style.top = `${coordinates.y}px`;
  return coordinates;
}

function listenToMessages(videoFrame: HTMLElement) {
  cameraStyleChannel.listen(({ borderColor, borderPreset, glowLevel }) => {
    console.log("message from cameraStyleChannel", borderColor, borderPreset);
    if (borderPreset) {
      if (borderPreset === "none") {
        const iframeContainer = videoFrame.querySelector(
          "#camera-iframe-container"
        ) as HTMLElement;
        BorderGradientModel.removeStyles(iframeContainer.id);
      } else {
        ContentScriptUI.applyGradient(videoFrame, {
          animatedBorderOptions: {
            borderPreset: borderPreset,
            glowLevel: glowLevel || "high",
          },
        });
      }
    } else if (borderColor) {
      ContentScriptUI.applyGradient(videoFrame, {
        borderColor: borderColor,
      });
    }
  });
}

async function create() {
  const iframeSrc = WebAccessibleResources.getFileURIForContent("video.html");
  if (!iframeSrc) {
    manager.danger("iframeSrc is not defined");
    throw new Error("iframeSrc is not defined");
  }

  const circleFrame = await appStorage.get("circle");
  const videoFrame = ContentScriptUI.manualCreation(iframeSrc, {
    circleFrame: circleFrame,
  });
  const iframeContainer = videoFrame.querySelector(
    "#camera-iframe-container"
  ) as HTMLElement;

  listenToMessages(videoFrame);

  const storedCameraSize = await appStorage.get("size");
  console.log("storedCameraSize", storedCameraSize);
  const variablesManager = new CSSVariablesManagerWithDefaultData(
    iframeContainer,
    {
      cameraSize: `${storedCameraSize}px`,
      size: storedCameraSize,
    }
  );
  const coordinates = {
    x: 0,
    y: 0,
    mouseDown: false,
  };

  // ! a botched attempt at getting the coordinates from the storage
  // const coordinates = await getStoredCoordinates();
  // if (coordinates.x === -1 && coordinates.y === -1) {
  //   coordinates.x = iframeContainer.getBoundingClientRect().x;
  //   coordinates.y = iframeContainer.getBoundingClientRect().y;
  // }
  // iframeContainer.style.left = `${coordinates.x}px`;
  // iframeContainer.style.top = `${coordinates.y}px`;
  // const coordinates = await initCoordinates(iframeContainer);
  iframeContainer.addEventListener("mousedown", (e) => {
    console.log("mouse down");
    coordinates.mouseDown = true;
  });

  iframeContainer.addEventListener("dblclick", async (e) => {
    console.log("dblclick");
    const size = Number(variablesManager.get("size"));
    let newSize = size + CONSTANTS.GROWTH_FACTOR;
    if (size >= CONSTANTS.MAX_SIZE || size >= window.innerWidth - 100) {
      newSize = CONSTANTS.MIN_SIZE;
    }
    variablesManager.set("cameraSize", `${newSize}px`);
    variablesManager.set("size", newSize);
    await appStorage.set("size", newSize);
  });

  iframeContainer.addEventListener("mouseup", async (e) => {
    coordinates.mouseDown = false;
    await appStorage.set("webcamCoordinates", {
      x: coordinates.x,
      y: coordinates.y,
    });
  });

  document.addEventListener(
    "mousemove",
    throttle((e) => {
      if (coordinates.mouseDown) {
        coordinates.x = e.clientX;
        coordinates.y = e.clientY;
        let newX =
          coordinates.x -
          Math.floor(iframeContainer.getBoundingClientRect().width / 2);
        let newY =
          coordinates.y -
          Math.floor(iframeContainer.getBoundingClientRect().height / 2);
        if (newX < 0) {
          newX = 0;
        }
        if (newY < 0) {
          newY = 0;
        }
        const cameraWidth = Number(variablesManager.get("size"));
        let cameraHeight = cameraWidth;
        if (!circleFrame) {
          // 16/9 aspect ratio
          cameraHeight = cameraWidth * 0.5625;
        }
        if (newX > window.innerWidth - cameraWidth) {
          newX = window.innerWidth - cameraWidth;
        }
        if (newY > window.innerHeight - cameraHeight) {
          newY = window.innerHeight - cameraHeight;
        }

        // lerp({
        //   currentPos: {
        //     x: iframeContainer.getBoundingClientRect().x,
        //     y: iframeContainer.getBoundingClientRect().y,
        //   },
        //   targetPos: { x: newX, y: newY },
        //   callback: ({ x, y }) => {
        //     iframeContainer.style.left = `${x}px`;
        //     iframeContainer.style.top = `${y}px`;
        //   },
        // });
        iframeContainer.style.left = `${newX}px`;
        iframeContainer.style.top = `${newY}px`;
        coordinates.x = newX;
        coordinates.y = newY;
      }
    }, 50)
  );
}

if (!document.querySelector("#camera-iframe-container")) {
  MessagesModel.receivePingFromBackground();
  create();
}
// else {
//   const iframeContainer = document.querySelector(
//     "#camera-iframe-container"
//   ) as HTMLElement;
//   if (!iframeContainer) throw new Error("iframeContainer is not defined");
//   const coordinates = await initCoordinates(iframeContainer);
// }
