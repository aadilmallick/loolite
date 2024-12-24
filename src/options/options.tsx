import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./options.css";
import { DOM, html } from "../utils/Dom";
import { ToastManager } from "./Toast";
import { BasicScreenRecorder } from "./BasicScreenRecord";
import { ScreenRecorder } from "../offscreen/ScreenRecorder";
import { NavigatorPermissions } from "../offscreen/NavigatorPermissions";
import { CameraRecorder } from "../offscreen/CameraRecorder";

const toast = new ToastManager({
  position: "top-right",
  id: "amallick2022amallick-toasts-ez-screen-recorder",
});
toast.setup();

const App = html`
  <main class="max-w-4xl mx-auto p-4">
    <div class="mb-4 space-x-2">
      <button id="enable-mic" class="bg-black text-white px-4 py-2 rounded-lg">
        Enable Mic Permissions
      </button>
      <button
        id="enable-camera"
        class="bg-black text-white px-4 py-2 rounded-lg"
      >
        Enable Camera Permissions
      </button>
    </div>
    <button id="mic" class="bg-black text-white px-4 py-2 rounded-lg">
      Record Audio
    </button>
    <button id="video" class="bg-black text-white px-4 py-2 rounded-lg">
      Record Mic and video
    </button>
    <button id="screen" class="bg-black text-white px-4 py-2 rounded-lg">
      Record Screen only
    </button>
  </main>
`;

const appElement = DOM.createDomElement(App);
document.body.appendChild(appElement);

const screenRecorder = new BasicScreenRecorder();

const micButton = appElement.querySelector("#mic") as HTMLButtonElement;
const videoButton = appElement.querySelector("#video") as HTMLButtonElement;
const screenButton = appElement.querySelector("#screen") as HTMLButtonElement;
const enableMicButton = appElement.querySelector(
  "#enable-mic"
) as HTMLButtonElement;
const enableCameraButton = appElement.querySelector(
  "#enable-camera"
) as HTMLButtonElement;

enableCameraButton.addEventListener("click", async () => {
  const granted = await NavigatorPermissions.checkPermission("camera");
  console.log("permission status", granted);
  if (granted === "granted") {
    toast.success("Camera permissions granted");
  } else {
    const cameraRecorder = new CameraRecorder();
    const success = await cameraRecorder.startVideoRecording({
      onStop: () => {
        console.log("stopping recording..");
      },
    });
    if (!success) {
      toast.danger("Camera permissions denied");
      return;
    }
    await cameraRecorder.stopRecording();
  }
});

enableMicButton.addEventListener("click", async () => {
  const granted = await ScreenRecorder.checkMicPermission();
  console.log("permission status", granted);
  if (granted === "granted") {
    toast.success("Mic permissions granted");
  } else {
    const screenRecorder = new ScreenRecorder();
    const success = await screenRecorder.startAudioRecording({
      onStop: () => {
        console.log("stopping recording..");
      },
    });
    if (!success) {
      toast.danger("mic permissions denied");
      return;
    }
    await screenRecorder.stopRecording();
  }
});

function createReactiveProxy<T extends string, V>(
  key: T,
  value: V,
  onSet: (newValue: V) => void
) {
  const proxy = new Proxy({ [key]: value } as Record<T, V>, {
    set(target, p, newValue, receiver) {
      onSet(newValue);
      return Reflect.set(target, p, newValue, receiver);
    },
  });
  return proxy;
}

const micButtonRecording = createReactiveProxy(
  "value",
  false,
  async (newValue) => {
    if (newValue) {
      toast.toast("Recording started");
      micButton.textContent = "Recording...";
    } else {
      micButton.textContent = "Record Audio";
      toast.success("Recording stopped");
    }
  }
);

const videoButtonRecording = createReactiveProxy(
  "value",
  false,
  async (newValue) => {
    if (newValue) {
      toast.toast("Recording started");
      videoButton.textContent = "Recording...";
    } else {
      videoButton.textContent = "Record Mic and video";
      toast.success("Recording stopped");
    }
  }
);

const screenButtonRecording = createReactiveProxy(
  "value",
  false,
  async (newValue) => {
    if (newValue) {
      toast.toast("Recording started");
      screenButton.textContent = "Recording...";
    } else {
      screenButton.textContent = "Record Screen only";
      toast.success("Recording stopped");
    }
  }
);

screenButton.addEventListener("click", async () => {
  if (screenButtonRecording.value) {
    await screenRecorder.stopRecording();
    return;
  }
  const recordingSucceeded = await screenRecorder.startVideoRecording({
    recordMic: false,
    onStop: () => {
      screenButtonRecording.value = false;
    },
  });
  console.log("recordingSucceeded", recordingSucceeded);
  if (recordingSucceeded) {
    screenButtonRecording.value = true;
  } else {
    toast.danger("Recording failed");
    screenButtonRecording.value = false;
  }
});

videoButton.addEventListener("click", async () => {
  if (videoButtonRecording.value) {
    await screenRecorder.stopRecording();
    return;
  }
  const recordingSucceeded = await screenRecorder.startVideoRecording({
    recordMic: true,
    onRecordingCanceled: () => {
      videoButtonRecording.value = false;
    },
    onRecordingFailed: () => {
      videoButtonRecording.value = false;
    },
    onStop: () => {
      videoButtonRecording.value = false;
    },
  });
  console.log("recordingSucceeded", recordingSucceeded);
  if (recordingSucceeded) {
    videoButtonRecording.value = true;
  }
});

micButton.addEventListener("click", async () => {
  console.log("micButtonRecording", micButtonRecording.value);
  if (micButtonRecording.value) {
    await screenRecorder.stopRecording();
    return;
  }
  const recordingSucceeded = await screenRecorder.startAudioRecording({
    onStop: () => {
      console.log("stopping recording..");
      micButtonRecording.value = false;
    },
  });
  console.log("recordingSucceeded", recordingSucceeded);
  if (recordingSucceeded) {
    micButtonRecording.value = true;
  }
});
