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
}

function onNotRecording() {
  stopRecording.disabled = true;
  startRecording.disabled = false;
  appStorage.set("isRecording", false);
}

async function handleRecordingStatus() {
  const isRecording = await appStorage.get("isRecording");
  if (isRecording) {
    onIsRecording();
  } else {
    onNotRecording();
  }
}

handleRecordingStatus();

startRecording.addEventListener("click", async () => {
  // const stream = await navigator.mediaDevices.getUserMedia({
  //   audio: true,
  //   video: false,
  // });
  await Offscreen.setupOffscreenDocument({
    justification: "to record screen content and record audio",
    reasons: Offscreen.getReasons(["DISPLAY_MEDIA", "USER_MEDIA"]),
    url: "offscreen.html",
  });
  const isChecked = recordMicCheckbox.checked;
  startRecordingChannel.sendP2P({
    recordAudio: isChecked,
  });
});

stopRecording.addEventListener("click", async () => {
  await Offscreen.setupOffscreenDocument({
    justification: "to record screen content",
    reasons: Offscreen.getReasons(["DISPLAY_MEDIA", "USER_MEDIA"]),
    url: "offscreen.html",
  });
  stopRecordingChannel.sendP2P(undefined);
});

currentlyRecording.listen(() => {
  onIsRecording();
  appStorage.set("isRecording", true);
});

notCurrentlyRecording.listen(() => {
  onNotRecording();
  appStorage.set("isRecording", false);
});

canceledRecording.listen(() => {
  onNotRecording();
  appStorage.set("isRecording", false);
});
