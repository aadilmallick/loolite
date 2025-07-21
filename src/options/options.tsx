import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./options.css";
import "../popup/popup.css";
import { DOM, html } from "../utils/Dom";
import { ToastManager } from "./Toast";
import { BasicScreenRecorder } from "./BasicScreenRecord";
import { Permissions } from "./Permissions";

const toast = new ToastManager({
  position: "top-right",
  id: "amallick2022amallick-toasts-ez-screen-recorder",
});
toast.setup();

const App = () => (
  <main className="max-w-4xl mx-auto p-4 w-[90vw]">
    <Permissions toast={toast} />
    <div className="mt-4 flex gap-4">
      <button id="mic" className="bg-black text-white px-4 py-2 rounded-lg">
        Record Audio
      </button>
      <button id="video" className="bg-black text-white px-4 py-2 rounded-lg">
        Record Mic and video
      </button>
      <button id="screen" className="bg-black text-white px-4 py-2 rounded-lg">
        Record Screen only
      </button>
    </div>
  </main>
);

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);

const screenRecorder = new BasicScreenRecorder();

const micButton = document.querySelector("#mic") as HTMLButtonElement;
const videoButton = document.querySelector("#video") as HTMLButtonElement;
const screenButton = document.querySelector("#screen") as HTMLButtonElement;

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
