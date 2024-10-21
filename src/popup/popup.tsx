import {
  startRecordingChannel,
  stopRecordingChannel,
} from "../background/controllers/messages";
import Offscreen from "../chrome-api/offscreen";
import Scripting, { ContentScriptModel } from "../chrome-api/scripting";
import Tabs from "../chrome-api/tabs";
import "../index.css";
import { DOM, html } from "../utils/Dom";
import "./popup.css";

const HTMLContent = html`
  <section>
    <h1 class="text-2xl font-bold">Screen Recorder</h1>
    <button class="bg-black text-white px-4 py-2 rounded-lg" id="start">
      Start Recording
    </button>
    <button class="bg-black text-white px-4 py-2 rounded-lg" id="stop">
      Stop Recording
    </button>
  </section>
`;

const app = DOM.createDomElement(HTMLContent) as HTMLDivElement;
document.body.appendChild(app);

const startRecording = app.querySelector("#start") as HTMLButtonElement;
const stopRecording = app.querySelector("#stop") as HTMLButtonElement;

/**
 * * The reason why we must use an offscreen document
 * is because when doing navigator.mediaDevices.getUserMedia in
 * a content script, the recording will stop once you switch tabs.
 *
 * The only way to keep the recording going across navigations is to use an offscreen document.
 */

startRecording.addEventListener("click", async () => {
  await Offscreen.setupOffscreenDocument({
    justification: "to record screen content",
    reasons: Offscreen.getReasons(["DISPLAY_MEDIA"]),
    url: "offscreen.html",
  });
  startRecordingChannel.sendP2P(undefined);
});

stopRecording.addEventListener("click", async () => {
  await Offscreen.setupOffscreenDocument({
    justification: "to record screen content",
    reasons: Offscreen.getReasons(["DISPLAY_MEDIA"]),
    url: "offscreen.html",
  });
  stopRecordingChannel.sendP2P(undefined);
});
