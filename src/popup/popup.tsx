import {
  canceledRecording,
  currentlyRecording,
  notCurrentlyRecording,
  startRecordingChannel,
  stopRecordingChannel,
  logToBackground,
} from "../background/controllers/messages";
import {
  injectCamera,
  removeCamera,
  getAllScriptableTabs,
} from "../background/controllers/scriptingControllers";
import { appStorage } from "../background/controllers/storage";
import Offscreen from "../chrome-api/offscreen";
import Scripting from "../chrome-api/scripting";
import Tabs from "../chrome-api/tabs";
import { WebAccessibleResources } from "../chrome-api/webAccessibleResources";
import "../index.css";
import { NavigatorPermissions } from "../offscreen/NavigatorPermissions";
import { DOM, html } from "../utils/Dom";
import "./popup.css";

const HTMLContent = html`
  <section>
    <h1 class="text-2xl font-bold">Screen Recorder</h1>
    <div class="p-2">
      <label htmlFor="mic" class="text-gray-500 text-sm">Record mic?</label>
      <input type="checkbox" name="mic" id="mic" />
    </div>
    <div class="p-2">
      <label htmlFor="camera" class="text-gray-500 text-sm"
        >Record camera?</label
      >
      <input type="checkbox" name="camera" id="camera" />
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
    <button
      class="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
      id="inject"
    >
      Inject Scripts
    </button>
    <button
      class="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
      id="remove"
    >
      Remove Scripts
    </button>
  </section>
`;

const app = DOM.createDomElement(HTMLContent) as HTMLDivElement;
document.body.appendChild(app);

const startRecording = app.querySelector("#start") as HTMLButtonElement;
const stopRecording = app.querySelector("#stop") as HTMLButtonElement;
const recordMicCheckbox = app.querySelector("#mic") as HTMLInputElement;
const recordCameraCheckbox = app.querySelector("#camera") as HTMLInputElement;

document.querySelector("#inject").addEventListener("click", async () => {
  console.log("test button clicked");
  // const tabs = (
  //   await Tabs.getAllTabs({
  //     allWindows: true,
  //   })
  // )
  //   .filter((tab) => tab.url)
  //   .filter((tab) => !tab.url.startsWith("chrome"));
  // console.log("scriptable tabs", tabs);
  // const tabIds = tabs.map((tab) => tab.id);
  // console.log(tabIds);
  // try {
  //   const promises = tabIds.map((tabId) => {
  //     return Scripting.executeScripts(
  //       tabId,
  //       WebAccessibleResources.getFileURIForProcess("camera.js"),
  //       "ISOLATED"
  //     );
  //   });
  //   await Promise.all(promises);
  // } catch (e) {
  //   console.error(e);
  // }
  const currentTab = await Tabs.getCurrentTab();
  if (currentTab.url?.startsWith("http")) {
    await injectCamera(currentTab.id);
  }
});

document.querySelector("#remove").addEventListener("click", async () => {
  const tabs = (
    await Tabs.getAllTabs({
      allWindows: true,
    })
  )
    .filter((tab) => tab.url)
    .filter((tab) => !tab.url.startsWith("chrome"));
  console.log("scriptable tabs", tabs);
  const tabIds = tabs.map((tab) => tab.id);

  const promises = tabIds.map((tabId) => {
    return removeCamera(tabId);
  });
  await Promise.all(promises);
});
/**
 * * The reason why we must use an offscreen document
 * is because when doing navigator.mediaDevices.getUserMedia in
 * a content script, the recording will stop once you switch tabs.
 *
 * The only way to keep the recording going across navigations is to use an offscreen document.
 */

stopRecording.disabled = true;

async function onIsRecording() {
  stopRecording.disabled = false;
  startRecording.disabled = true;

  await appStorage.set("isRecording", true);
  await chrome.action.setBadgeText({ text: "REC" });
  console.log("%c current storage", "color: red; font-size: 20px");
  console.log(await appStorage.getAll());
}

async function onNotRecording() {
  stopRecording.disabled = true;
  startRecording.disabled = false;
  await appStorage.set("isRecording", false);
  await appStorage.set("isRecordingCamera", false);
  console.log("%c current storage", "color: red; font-size: 20px");
  console.log(await appStorage.getAll());
  await chrome.action.setBadgeText({ text: "" });
  const scriptableTabs = await getAllScriptableTabs();
  await Promise.all(
    scriptableTabs.map((tabId) => {
      return removeCamera(tabId);
    })
  );
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

async function handleMicPermission() {
  const perm = await NavigatorPermissions.checkPermission("microphone");
  if (perm === "prompt") {
    // redirect users to my options
    chrome.runtime.openOptionsPage();
    return false;
  } else if (perm === "denied") {
    // redirect users to change settings for my extension
    const settingsUrl = `chrome://extensions/?id=${chrome.runtime.id}`;
    chrome.tabs.create({ url: settingsUrl, active: true });
    return false;
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      console.log("stream", stream);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

async function handleCameraPermission() {
  const perm = await NavigatorPermissions.checkPermission("camera");
  if (perm === "prompt") {
    // redirect users to my options
    chrome.runtime.openOptionsPage();
    return false;
  } else if (perm === "denied") {
    // redirect users to change settings for my extension
    const settingsUrl = `chrome://extensions/?id=${chrome.runtime.id}`;
    chrome.tabs.create({ url: settingsUrl, active: true });
    return false;
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
      console.log("stream", stream);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

startRecording.addEventListener("click", async () => {
  const shouldRecordMic = recordMicCheckbox.checked;
  const shouldRecordCamera = recordCameraCheckbox.checked;
  // request audio permissions if checked
  if (shouldRecordMic) {
    const isGranted = await handleMicPermission();
    console.log("mic permission isGranted", isGranted);
    if (!isGranted) {
      return;
    }
  }

  // request camera permissions if checked
  if (shouldRecordCamera) {
    const isGranted = await handleCameraPermission();
    console.log("camera permission isGranted", isGranted);
    if (!isGranted) {
      return;
    }
    await appStorage.set("isRecordingCamera", true);
  }
  await Offscreen.setupOffscreenDocument({
    justification: "to record screen content and record audio",
    reasons: Offscreen.getReasons(["DISPLAY_MEDIA", "USER_MEDIA"]),
    url: "offscreen.html",
  });
  startRecording.disabled = true;
  await sleep(500);
  startRecordingChannel.sendP2P({
    recordAudio: shouldRecordMic,
    recordCamera: shouldRecordCamera,
  });
});

// when you click stop button, send stop message to offscreen document
stopRecording.addEventListener("click", async () => {
  await Offscreen.setupOffscreenDocument({
    justification: "to record screen content",
    reasons: Offscreen.getReasons(["DISPLAY_MEDIA", "USER_MEDIA"]),
    url: "offscreen.html",
  });
  const response = await stopRecordingChannel.sendP2PAsync(undefined);
  logToBackground("popup", { response });
  if (response.recordingStoppedSuccessfully) {
    onNotRecording();
  }
});

// ! listening in popup is not advisable because
// ! the listeners will clear up once popup closes.
// ! setup majority of listeners in background script.

async function injectCameraIntoCurrentTab() {
  const tabs = await chrome.tabs.query({ highlighted: true });
  tabs.forEach((tab) => {
    if (tab.url?.startsWith("http")) {
      injectCamera(tab.id);
    }
  });
}

currentlyRecording.listen(({ withCamera }) => {
  // injectCameraIntoCurrentTab();
  logToBackground("popup", { withCamera });
  onIsRecording();
  injectCameraIntoCurrentTab();
});

notCurrentlyRecording.listen(() => {
  logToBackground(
    "popup",
    "message received from offscreen not currently recording"
  );
  onNotRecording();
});

canceledRecording.listen(() => {
  onNotRecording();
});
