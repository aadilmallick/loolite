import { createReactiveProxy, css, DOM, html } from "../utils/Dom";
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
  <div class="pip-container" id="pip-container"></div>
`);
pipContainer.appendChild(cameraVideo);
// TODO: Add loading overlay to pipContainer

function getStyles(options?: {
  circleFrame?: boolean;
  gradientActive?: boolean;
}) {
  return css`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .pip-container {
      min-width: 200px;
      width: 500px;
      position: relative;
      /* aspect-ratio: 16 / 9; */
      ${options?.circleFrame ? "border-radius: 9999px;" : ""}
    }

    video {
      transform: scaleX(-1);
      max-width: 100%;
      height: 100%;
      object-fit: cover;
      ${options?.circleFrame ? "border-radius: 9999px;" : ""}
      ${options?.gradientActive ? "border-radius: 4px;" : ""}
    }

    @media (display-mode: picture-in-picture) {
      .pip-container {
        width: 100%;
        height: 100%;
        ${options?.gradientActive ? "padding: 8px;" : ""}
      }

      body {
        min-width: 200px;
        /* aspect-ratio: 16 / 9; */
        width: 100%;
        height: 100%;
      }

      html {
        background-color: black;
        display: grid;
        overflow-y: hidden;
        place-items: center;
      }
    }
  `;
}

const pipStyles = getStyles();
class CameraSettingsManager {
  static stylesID = "camera-settings";
  public stylesProxy = createReactiveProxy("css", pipStyles, (newCss) => {
    const styleTag = document.getElementById(CameraSettingsManager.stylesID);
    if (styleTag) {
      styleTag.textContent = newCss;
    }
  });
  public cameraPlayer = new PIPElement(pipContainer, {
    width: 200,
    height: 200 * (9 / 16),
  });

  setCircleFrame(circleFrame: boolean) {
    if (circleFrame) {
      this.cameraPlayer = new PIPElement(pipContainer, {
        width: 200,
        height: 200,
      });
    } else {
      this.cameraPlayer = new PIPElement(pipContainer, {
        width: 200,
        height: 200 * (9 / 16),
      });
    }

    this.stylesProxy.css = getStyles({ circleFrame });
  }

  setBorderGradientActive(gradientActive: boolean) {
    this.stylesProxy.css = getStyles({ gradientActive });
  }

  constructor() {
    const styleTag = document.createElement("style");
    styleTag.textContent = `${this.stylesProxy.css}`;
    styleTag.id = CameraSettingsManager.stylesID;
    document.head.appendChild(styleTag);
  }
}

const cameraSettingsManager = new CameraSettingsManager();

// DOM.addStyleTag(pipStyles, CameraSettingsManager.stylesID);

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
    await cameraSettingsManager.cameraPlayer.openPipWindow();
    cameraSettingsManager.cameraPlayer.copyStylesToPipWindow();
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

cameraSettingsManager.cameraPlayer.Events.onPIPEnter((pipWindow) => {
  console.log("pip window enter", pipWindow);
  pipContainer.remove();
});

import React from "react";
import { injectRoot } from "../utils/ReactUtils";
import {
  BorderGradientFactory,
  BorderGradientModel,
} from "../utils/BorderGradient";

const CameraSettings = () => {
  const [glowLevel, setGlowLevel] = React.useState<
    "high" | "medium" | "low" | "none"
  >("high");
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
            if (borderPreset === "none") {
              BorderGradientModel.removeStyles(pipContainer.id);
              cameraSettingsManager.setBorderGradientActive(false);
            }
            if (borderPreset === "rainbow") {
              BorderGradientModel.removeStyles(pipContainer.id);
              BorderGradientFactory.createPresetGradient(
                pipContainer,
                borderPreset,
                {
                  glowLevel: glowLevel,
                }
              );
              cameraSettingsManager.setBorderGradientActive(true);
            }
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
          value={glowLevel}
          onChange={(e) => {
            const newGlowLevel = e.target.value as
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
