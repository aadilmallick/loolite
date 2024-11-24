import { LocalStorage, SyncStorage } from "../../chrome-api/storage";

export const appStorage = new LocalStorage({
  isRecording: false,
});
export const appSettingsStorage = new SyncStorage({});

// define static methods here
export class StorageHandler {}
