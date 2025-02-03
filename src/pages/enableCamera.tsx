import { css, DOM, html } from "../utils/Dom";
import { AbortControllerManager, PIPElement } from "../utils/PIP";
import "../index.css";

const cameraVideo = DOM.createDomElement(html`
  <video muted></video>
`) as HTMLVideoElement;

const loadingOverlay = DOM.createDomElement(html`
  <div class="loading-overlay">
    <span></span>
  </div>
`);

const pipContainer = DOM.createDomElement(html`
  <div class="pip-container"></div>
`);
pipContainer.appendChild(cameraVideo);
// TODO: Add loading overlay to pipContainer

const pipStyles = css`
  * {
    margin: 0;
    padding: 0;
  }

  .pip-container {
    min-width: 200px;
    width: 500px;
    /* aspect-ratio: 16 / 9; */
  }

  video {
    transform: scaleX(-1);
    max-width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (display-mode: picture-in-picture) {
    .pip-container {
      width: 100%;
      height: 100%;
    }

    body {
      min-width: 200px;
      /* aspect-ratio: 16 / 9; */
      width: 100%;
      height: 100%;
    }

    html {
      overflow: hidden;
      background-color: black;
      display: grid;
      place-items: center;
    }
  }
`;

DOM.addStyleTag(pipStyles);

const cameraPlayer = new PIPElement(pipContainer, {
  width: 200,
  height: 200 * (9 / 16),
});
const abortContollerManager = new AbortControllerManager();

let stream: MediaStream | null = null;

async function togglePictureInPicture() {
  console.log("pip window open", PIPElement.pipWindowOpen);
  try {
    if (PIPElement.pipWindowOpen) {
      PIPElement.closePipWindow();
      return;
    }
    abortContollerManager.abort();
    abortContollerManager.reset();

    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
        aspectRatio: 1.7777777778,
      },
    });
    console.log("stream", stream);
    cameraVideo.srcObject = stream;
    await cameraVideo.play();
    await cameraPlayer.openPipWindow();
    cameraPlayer.copyStylesToPipWindow();
    PIPElement.pipWindow?.addEventListener(
      "pagehide",
      () => {
        console.log("PiP window closed.");
        htmlContent.appendChild(pipContainer);
        // Perform any cleanup or UI updates here
      },
      {
        signal: abortContollerManager.signal,
      }
    );
    // const video = document.createElement("video");
    // video.srcObject = stream;
    // await video.play();
    // await video.requestPictureInPicture();
  } catch (error) {
    console.error("Error starting picture in picture", error);
  }
}

const pageContent = html`
  <div class="p-4">
    <button
      id="start"
      class="bg-blue-400 text-white px-3 py-1 rounded-md cursor-pointer"
    >
      Toggle Picture in Picture
    </button>
  </div>
`;

const htmlContent = DOM.createDomElement(pageContent);
document.body.appendChild(htmlContent);
htmlContent.appendChild(pipContainer);

DOM.$("#start")?.addEventListener("click", togglePictureInPicture);

cameraPlayer.Events.onPIPEnter((pipWindow) => {
  console.log("pip window enter", pipWindow);
  pipContainer.remove();
});

import React from "react";
import { injectRoot } from "../utils/ReactUtils";

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

injectRoot(<CameraSettings />);
