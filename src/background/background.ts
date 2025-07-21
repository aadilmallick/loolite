import { Runtime } from "../chrome-api/runtime";
import Tabs from "../chrome-api/tabs";
import {
  canceledRecording,
  currentlyRecording,
  logChannel,
  notCurrentlyRecording,
} from "./controllers/messages";
import {
  BasicColorLogger,
  getAllScriptableTabs,
  injectCamera,
  removeCamera,
} from "./controllers/scriptingControllers";
import { appStorage } from "./controllers/storage";
import { WebAccessibleResources } from "../chrome-api/webAccessibleResources";

Runtime.onInstall({
  onAll: async () => {
    await appStorage.setup();
    await appStorage.clear();
    await appStorage.setup();
    console.log(await appStorage.getAll());
  },
});

logChannel.listen(({ message, sender }) => {
  console.log(`from ${sender}:`, message);
});

async function onStopRecording() {
  await Promise.all([
    appStorage.set("isRecording", false),
    appStorage.set("isRecordingCamera", false),
    chrome.action.setBadgeText({ text: "" }),
  ]);
  const pinnedTab = (
    await chrome.tabs.query({
      pinned: true,
    })
  ).filter((tab) => tab.url?.includes(chrome.runtime.id))[0];
  pinnedTab && (await chrome.tabs.remove(pinnedTab.id!));
}

async function onStartRecording(withCamera: boolean) {
  await Promise.all([
    appStorage.set("isRecording", true),
    appStorage.set("isRecordingCamera", withCamera),
    chrome.action.setBadgeText({ text: "REC" }),
  ]);

  if (withCamera) {
    // Create the enableCamera.html tab
    await Tabs.createTab({
      active: true,
      pinned: true,
      url: WebAccessibleResources.getFileURIForProcess("enableCamera.html"),
    });
  }
}

currentlyRecording.listen(({ withCamera }) => {
  onStartRecording(withCamera);
});

notCurrentlyRecording.listenAsync(async () => {
  await onStopRecording();
});

canceledRecording.listen(() => {
  onStopRecording();
});

Tabs.Events.onTabHighlighted(async ({ tabIds }) => {
  // const scriptableTabs = await getAllScriptableTabs();
  // const tabId = tabIds[0];
  // const tab = await Tabs.getTabById(tabId);
  // if (!tab.url?.startsWith("http")) return;
  // if (!scriptableTabs.includes(tabId)) return;
  // const isRecording = await appStorage.get("isRecording");
  // const isCameraRecording = await appStorage.get("isRecordingCamera");
  // console.log("%c current storage", "color: red; font-size: 20px");
  // console.log(await appStorage.getAll());
  // isRecording && isCameraRecording && (await injectCamera(tabId));
});

Tabs.Events.onTabNavigateComplete(async (tabId, tab) => {
  if (!tab.url?.startsWith("http")) return;
  console.log("tab navigate complete");

  // const scriptableTabs = await getAllScriptableTabs();
  // if (!scriptableTabs.includes(tabId)) return;

  // const isRecording = await appStorage.get("isRecording");
  // const isCameraRecording = await appStorage.get("isRecordingCamera");
  // console.log("%c current storage", "color: red; font-size: 20px");
  // console.log(await appStorage.getAll());
  // isRecording && isCameraRecording && (await injectCamera(tabId));
});
