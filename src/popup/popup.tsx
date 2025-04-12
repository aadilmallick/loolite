import {
  canceledRecording,
  currentlyRecording,
  notCurrentlyRecording,
  startRecordingChannel,
  stopRecordingChannel,
  logToBackground,
  cameraStyleChannel,
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
import { CameraRecorder } from "../offscreen/CameraRecorder";
import { NavigatorPermissions } from "../offscreen/NavigatorPermissions";
import { DOM, html } from "../utils/Dom";
import Toaster from "../utils/web-components/Toaster";
import "./popup.css";

// region HTML

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
    <div class="p-2">
      <label htmlFor="circle" class="text-gray-500 text-sm"
        >Circle Frame?</label
      >
      <input type="checkbox" name="circle" id="circle" />
    </div>
    <div class="p-2">
      <label htmlFor="developer-settings" class="text-gray-500 text-sm"
        >Turn on developer settings</label
      >
      <input
        type="checkbox"
        name="developer-settings"
        id="developer-settings"
      />
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
    <hr class="my-2" />
    <div class="p-2 space-y-4" id="actions">
      <div class="flex justify-around flex-wrap gap-2">
        <button
          class="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
          id="reset"
        >
          Reset camera
        </button>
        <button
          class="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
          id="inject"
        >
          Inject camera
        </button>
        <button
          class="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
          id="remove"
        >
          Remove camera
        </button>
      </div>
      <div class="p-2">
        <label htmlFor="border-color" class="text-gray-500 text-sm"
          >Border-color?</label
        >
        <input type="color" name="border-color" id="border-color" />
      </div>
      <div class="p-2 flex items-center gap-2">
        <label htmlFor="border-preset" class="text-gray-500 text-sm"
          >Border preset?</label
        >
        <select
          id="border-preset"
          name="border-preset"
          class="border-2 border-gray-300 p-1 rounded-lg w-full flex-1"
        >
          <option value="rainbow" selected>rainbow</option>
          <option value="none">none</option>
        </select>
      </div>
      <div class="p-2 flex items-center gap-2">
        <label htmlFor="glow-level" class="text-gray-500 text-sm"
          >Glow Level?</label
        >
        <select
          id="glow-level"
          name="glow-level"
          class="border-2 border-gray-300 p-1 rounded-lg w-full flex-1"
        >
          <option value="high" selected>high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
          <option value="none">none</option>
        </select>
      </div>
      <button
        class="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
        id="apply-preset"
      >
        Apply-preset
      </button>
    </div>
    <!--
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
    -->
  </section>
`;

const app = DOM.createDomElement(HTMLContent) as HTMLDivElement;
document.body.appendChild(app);

Toaster.registerSelf();
const toaster = DOM.createDomElement(html`<toaster-element
  data-position="top-right"
></toaster-element>`) as Toaster;
document.body.appendChild(toaster);

const startRecording = app.querySelector("#start") as HTMLButtonElement;
const stopRecording = app.querySelector("#stop") as HTMLButtonElement;
const resetCameraBtn = app.querySelector("#reset") as HTMLButtonElement;
const recordMicCheckbox = app.querySelector("#mic") as HTMLInputElement;
const recordCameraCheckbox = app.querySelector("#camera") as HTMLInputElement;
const circleFrameCheckbox = app.querySelector("#circle") as HTMLInputElement;
const injectCameraButton = app.querySelector("#inject") as HTMLButtonElement;
const removeCameraButton = app.querySelector("#remove") as HTMLButtonElement;
const developerSettingsCheckbox = app.querySelector(
  "#developer-settings"
) as HTMLInputElement;
const developerSettings = app.querySelector("#actions") as HTMLInputElement;
const colorPicker = app.querySelector("#border-color") as HTMLInputElement;
const presetSelect = app.querySelector("#border-preset") as HTMLSelectElement;
const glowLevelSelect = app.querySelector("#glow-level") as HTMLSelectElement;
const applyPresetButton = app.querySelector(
  "#apply-preset"
) as HTMLButtonElement;

developerSettings.style.visibility = "hidden";

const currentTab = Tabs.getCurrentTab();

// region developer settings

colorPicker.addEventListener("change", async () => {
  const color = colorPicker.value;
  const tab = await currentTab;
  if (!tab) return;
  cameraStyleChannel.sendP2CWithPing(tab.id!, { borderColor: color });
});

applyPresetButton.addEventListener("click", async () => {
  const presets = ["rainbow", "none"] as const;
  const borderPreset = presetSelect.value as (typeof presets)[number];
  const glowLevel = glowLevelSelect.value as "high" | "medium" | "low" | "none";
  if (!presets.includes(borderPreset)) return;

  const tab = await currentTab;
  if (!tab) return;
  cameraStyleChannel.sendP2CWithPing(tab.id!, {
    borderPreset: borderPreset as (typeof presets)[number],
    glowLevel,
  });
});

developerSettingsCheckbox.addEventListener("change", () => {
  if (developerSettingsCheckbox.checked) {
    developerSettings.style.visibility = "visible";
  } else {
    developerSettings.style.visibility = "hidden";
  }
});

injectCameraButton.addEventListener("click", async () => {
  const currentTab = await Tabs.getCurrentTab();
  if (!currentTab?.url?.startsWith("http")) return;

  // if (await CameraRecorder.isCameraInUse()) {
  //   toaster.danger("camera is in use");
  //   return;
  // }

  await injectCamera(currentTab.id!);
});

removeCameraButton.addEventListener("click", async () => {
  const currentTab = await Tabs.getCurrentTab();
  if (!currentTab?.url?.startsWith("http")) return;

  await removeCamera(currentTab.id!);
});

/**
 * * The reason why we must use an offscreen document
 * is because when doing navigator.mediaDevices.getUserMedia in
 * a content script, the recording will stop once you switch tabs.
 *
 * The only way to keep the recording going across navigations is to use an offscreen document.
 */

// region Recording

stopRecording.disabled = true;
resetCameraBtn.disabled = true;

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
  console.log(scriptableTabs);
  await Promise.all(
    scriptableTabs.map(async (tabId) => {
      try {
        removeCamera(tabId!);
      } catch (e) {
        console.log("cannot remove camera");
      }
    })
  );
}

async function handleRecordingStatus() {
  const isRecording = await appStorage.get("isRecording");
  const isCameraRecording = await appStorage.get("isRecordingCamera");
  if (isRecording && isCameraRecording) {
    resetCameraBtn.disabled = false;
  }
  if (isRecording) {
    onIsRecording();
  } else {
    onNotRecording();
  }
}

async function populateSettings() {
  const circleFrame = await appStorage.get("circle");
  console.log("circleFrame", circleFrame);
  circleFrameCheckbox.checked = circleFrame;
}

handleRecordingStatus();
populateSettings();

circleFrameCheckbox.addEventListener("change", async () => {
  await appStorage.set("circle", circleFrameCheckbox.checked);
});

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
  console.log("camera permission", perm);
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
    return true;
  }
}

resetCameraBtn.addEventListener("click", async () => {
  const currentTab = await Tabs.getCurrentTab();
  if (!currentTab?.url?.startsWith("http")) return;

  await removeCamera(currentTab.id!);
  await injectCamera(currentTab.id!);
});

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
    await appStorage.set("webcamCoordinates", null);
  }
  if (!shouldRecordCamera) {
    await appStorage.set("isRecordingCamera", false);
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
      injectCamera(tab.id!);
    }
  });
}

currentlyRecording.listen(({ withCamera }) => {
  // injectCameraIntoCurrentTab();
  logToBackground("popup", { withCamera });
  async function dookieShit() {
    await onIsRecording();
    // await injectCameraIntoCurrentTab(); TODO: remove this
    await Tabs.createTab({
      active: true,
      pinned: true,
      url: WebAccessibleResources.getFileURIForProcess("enableCamera.html"),
    });

    // setTimeout(() => {
    //   window.close();
    // }, 750);
  }

  if (withCamera) {
    appStorage.set("isRecordingCamera", true);
    dookieShit();
  } else {
    appStorage.set("isRecordingCamera", false);
  }
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
