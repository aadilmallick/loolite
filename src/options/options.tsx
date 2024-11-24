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

const state = {
  micButtonRecording: false,
  videoButtonRecording: false,
  screenButtonRecording: false,
};

screenButton.addEventListener("click", async () => {
  if (state.screenButtonRecording) {
    await screenRecorder.stopRecording();
    screenButton.textContent = "Record Screen only";
    toast.success("Recording stopped");
    state.screenButtonRecording = false;
    return;
  }
  const recordingSucceeded = await screenRecorder.startVideoRecording({
    recordMic: false,
    onStop: () => {
      screenButton.textContent = "Record Screen only";
      toast.success("Recording stopped");
      state.screenButtonRecording = false;
    },
  });
  console.log("recordingSucceeded", recordingSucceeded);
  if (recordingSucceeded) {
    toast.toast("Recording started");
    screenButton.textContent = "Recording...";
    state.screenButtonRecording = true;
  } else {
    toast.danger("Recording failed");
  }
});

videoButton.addEventListener("click", async () => {
  if (state.videoButtonRecording) {
    await screenRecorder.stopRecording();
    videoButton.textContent = "Record Mic and video";
    toast.success("Recording stopped");
    state.videoButtonRecording = false;
    return;
  }
  const recordingSucceeded = await screenRecorder.startVideoRecording({
    recordMic: true,
    onRecordingCanceled: () => {
      videoButton.textContent = "Record Mic and video";
      toast.warning("Recording canceled");
      state.videoButtonRecording = false;
    },
    onRecordingFailed: () => {
      videoButton.textContent = "Record Mic and video";
      toast.danger("Recording failed");
      state.videoButtonRecording = false;
    },
    onStop: () => {
      videoButton.textContent = "Record Mic and video";
      toast.success("Recording stopped");
      state.videoButtonRecording = false;
    },
  });
  console.log("recordingSucceeded", recordingSucceeded);
  if (recordingSucceeded) {
    toast.toast("Recording started");
    videoButton.textContent = "Recording...";
    state.videoButtonRecording = true;
  }
});

micButton.addEventListener("click", async () => {
  if (state.micButtonRecording) {
    await screenRecorder.stopRecording();
    micButton.textContent = "Record Audio";
    toast.success("Recording stopped");
    state.micButtonRecording = false;
    return;
  }
  const recordingSucceeded = await screenRecorder.startAudioRecording({
    onStop: () => {
      micButton.textContent = "Record Audio";
      toast.success("Recording stopped");
      state.micButtonRecording = false;
    },
  });
  console.log("recordingSucceeded", recordingSucceeded);
  if (recordingSucceeded) {
    toast.toast("Recording started");
    micButton.textContent = "Recording...";
    state.micButtonRecording = true;
  } else {
    toast.danger("Recording failed");
  }
});
