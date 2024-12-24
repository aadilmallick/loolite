import { LocalStorage, SyncStorage } from "../../chrome-api/storage";

export const appStorage = new LocalStorage({
  isRecording: false,
  isRecordingCamera: false,
  webcamCoordinates: null as { x: number; y: number } | null,
  circle: true,
});
export const appSettingsStorage = new SyncStorage({});

// define static methods here
export class StorageHandler {}
