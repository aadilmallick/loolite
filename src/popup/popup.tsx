import {
  canceledRecording,
  currentlyRecording,
  notCurrentlyRecording,
  startRecordingChannel,
  stopRecordingChannel,
} from "../background/controllers/messages";
import { appStorage } from "../background/controllers/storage";
import Offscreen from "../chrome-api/offscreen";
import "../index.css";
import { DOM, html } from "../utils/Dom";
import "./popup.css";

const HTMLContent = html`
  <section>
    <h1 class="text-2xl font-bold">Screen Recorder</h1>
    <div class="p-2">
      <label htmlFor="mic" class="text-gray-500 text-sm">Record mic?</label>
      <input type="checkbox" name="mic" id="mic" />
    </div>
    <button
      class="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
      id="start"
    >
      Start Recording
    </button>
    <button
      class="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
      id="stop"
    >
      Stop Recording
    </button>
  </section>
`;

const app = DOM.createDomElement(HTMLContent) as HTMLDivElement;
document.body.appendChild(app);

const startRecording = app.querySelector("#start") as HTMLButtonElement;
const stopRecording = app.querySelector("#stop") as HTMLButtonElement;
const recordMicCheckbox = app.querySelector("#mic") as HTMLInputElement;

/**
 * * The reason why we must use an offscreen document
 * is because when doing navigator.mediaDevices.getUserMedia in
 * a content script, the recording will stop once you switch tabs.
 *
 * The only way to keep the recording going across navigations is to use an offscreen document.
 */

stopRecording.disabled = true;

function onIsRecording() {
  stopRecording.disabled = false;
  startRecording.disabled = true;
  appStorage.set("isRecording", true);
}

function onNotRecording() {
  stopRecording.disabled = true;
  startRecording.disabled = false;
  appStorage.set("isRecording", false);
}

async function handleRecordingStatus() {
  const isRecording = await appStorage.get("isRecording");
  console.log(`popup opened, isRecording = ${isRecording}`);
  if (isRecording) {
    onIsRecording();
  } else {
    onNotRecording();
  }
}

handleRecordingStatus();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

startRecording.addEventListener("click", async () => {
  const isChecked = recordMicCheckbox.checked;
  // request audio permissions if checked
  if (isChecked) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      console.log("stream", stream);
    } catch (e) {
      return;
    }
  }
  await Offscreen.setupOffscreenDocument({
    justification: "to record screen content and record audio",
    reasons: Offscreen.getReasons(["DISPLAY_MEDIA", "USER_MEDIA"]),
    url: "offscreen.html",
  });
  startRecording.disabled = true;
  await sleep(500);
  const response = await startRecordingChannel.sendP2PAsync({
    recordAudio: isChecked,
  });
  console.log("response", response);
  if (response?.recordingSuccess) {
    onIsRecording();
  } else {
    onNotRecording();
  }
});

// when you click stop button, send stop message to offscreen document
stopRecording.addEventListener("click", async () => {
  await Offscreen.setupOffscreenDocument({
    justification: "to record screen content",
    reasons: Offscreen.getReasons(["DISPLAY_MEDIA", "USER_MEDIA"]),
    url: "offscreen.html",
  });
  const response = await stopRecordingChannel.sendP2PAsync(undefined);
  console.log("response", response);
  if (response.recordingStoppedSuccessfully) {
    onNotRecording();
    await appStorage.set("isRecording", false);
  }
});

currentlyRecording.listen(() => {
  onIsRecording();
  appStorage.set("isRecording", true);
});

// notCurrentlyRecording.listen(() => {
//   onNotRecording();
//   appStorage.set("isRecording", false);
// });

canceledRecording.listen(() => {
  onNotRecording();
  appStorage.set("isRecording", false);
});
