import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./options.css";
import { DOM, html } from "../utils/Dom";
import { ToastManager } from "./Toast";
import { BasicScreenRecorder } from "./BasicScreenRecord";

const toast = new ToastManager({
  position: "top-right",
  id: "amallick2022amallick-toasts-ez-screen-recorder",
});
toast.setup();

const App = html`
  <main class="max-w-4xl mx-auto p-4">
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
