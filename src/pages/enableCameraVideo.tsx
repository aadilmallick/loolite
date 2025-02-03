import {
  createReactiveProxy,
  css,
  DOM,
  DOMLifecycleManager,
  html,
} from "../utils/Dom";
import { AbortControllerManager, PIPVideo } from "../utils/PIP";
import "../index.css";

import React from "react";
import { injectRoot } from "../utils/ReactUtils";

class CameraSettingsManager {
  public stylesProxy = createReactiveProxy(
    "css",
    css`
      video {
        transform: scaleX(-1);
      }
    `,
    (newCss) => {}
  );

  constructor() {
    const styleTag = document.createElement("style");
    styleTag.textContent = `${this.stylesProxy.css}`;
    styleTag.id = "camera-settings";
    document.head.appendChild(styleTag);
  }
}

const cameraSettingsManager = new CameraSettingsManager();

const CameraSettings = () => {
  return (
    <>
      <div className="p-2">
        <label htmlFor="border-color" className="text-gray-500 text-sm">
          Border-color?
        </label>
        <input
          type="color"
          name="border-color"
          id="border-color"
          onChange={(e) => {
            const color = e.target.value;
          }}
        />
      </div>
      <div className="p-2 flex items-center gap-2">
        <label htmlFor="border-preset" className="text-gray-500 text-sm">
          Border preset?
        </label>
        <select
          onChange={(e) => {
            const borderPreset = e.target.value as "rainbow" | "none";
          }}
          id="border-preset"
          name="border-preset"
          defaultValue={"rainbow"}
          className="border-2 border-gray-300 p-1 rounded-lg w-full flex-1"
        >
          <option value="rainbow">rainbow</option>
          <option value="none">none</option>
        </select>
      </div>
      <div className="p-2 flex items-center gap-2">
        <label htmlFor="glow-level" className="text-gray-500 text-sm">
          Glow Level?
        </label>
        <select
          id="glow-level"
          name="glow-level"
          defaultValue={"high"}
          onChange={(e) => {
            const glowLevel = e.target.value as
              | "high"
              | "medium"
              | "low"
              | "none";
          }}
          className="border-2 border-gray-300 p-1 rounded-lg w-full flex-1"
        >
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
          <option value="none">none</option>
        </select>
      </div>
    </>
  );
};

const CameraPIP = () => {
  return (
    <div className="max-w-2xl">
      <button
        id="toggle-pip"
        className="px-3 py-1 bg-black rounded-md text-white cursor-pointer"
      >
        Toggle PIP
      </button>
      <video muted className="w-full aspect-video"></video>
      <CameraSettings />
    </div>
  );
};

injectRoot(<CameraPIP />);

async function main() {
  const isReady = await DOMLifecycleManager.documentIsReady();
  if (!isReady) {
    return;
  }

  const video = document.querySelector("video") as HTMLVideoElement;
  const togglePipButton = document.getElementById(
    "toggle-pip"
  ) as HTMLButtonElement;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
      aspectRatio: 1.7777777778,
    },
  });
  video.srcObject = stream;
  await video.play();

  // the video must be loaded and playing something before for PiP to work.
  const pipVideo = new PIPVideo(video);
  togglePipButton.addEventListener("click", async () => {
    await pipVideo.togglePictureInPicture();
  });
}

main();
