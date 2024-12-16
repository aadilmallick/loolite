import { Runtime } from "../chrome-api/runtime";
import {
  canceledRecording,
  logChannel,
  notCurrentlyRecording,
} from "./controllers/messages";
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

notCurrentlyRecording.listen(() => {
  appStorage.set("isRecording", false);
  chrome.action.setBadgeText({ text: "" });
});
