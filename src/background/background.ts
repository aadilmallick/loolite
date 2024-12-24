import { Runtime } from "../chrome-api/runtime";
import Tabs from "../chrome-api/tabs";
import {
  canceledRecording,
  logChannel,
  notCurrentlyRecording,
} from "./controllers/messages";
import {
  getAllScriptableTabs,
  injectCamera,
  removeCamera,
} from "./controllers/scriptingControllers";
import { appStorage } from "./controllers/storage";

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

  // remove camera from all injected tabs
  const scriptableTabs = await getAllScriptableTabs();
  console.log("scriptableTabs", scriptableTabs);
  await Promise.all(
    scriptableTabs.map((tabId) => {
      return removeCamera(tabId!);
    })
  );
}
notCurrentlyRecording.listen(() => {
  onStopRecording();
});

Tabs.Events.onTabHighlighted(async ({ tabIds }) => {
  const tabId = tabIds[0];
  const tab = await Tabs.getTabById(tabId);
  console.log("highlighted tab", tab);
  if (!tab.url?.startsWith("http")) return;
  const isRecording = await appStorage.get("isRecording");
  const isCameraRecording = await appStorage.get("isRecordingCamera");
  console.log("%c current storage", "color: red; font-size: 20px");
  console.log(await appStorage.getAll());

  isRecording && isCameraRecording && (await injectCamera(tabId));
});

Tabs.Events.onTabNavigateComplete(async (tabId, tab) => {
  if (!tab.url?.startsWith("http")) return;
  console.log("tab navigate complete", tab);

  const isRecording = await appStorage.get("isRecording");
  const isCameraRecording = await appStorage.get("isRecordingCamera");
  console.log("%c current storage", "color: red; font-size: 20px");
  console.log(await appStorage.getAll());
  isRecording && isCameraRecording && (await injectCamera(tabId));
});
