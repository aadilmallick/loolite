import { LocalStorage, SyncStorage } from "../../chrome-api/storage";

export const appStorage = new SyncStorage({
  isRecording: false,
  isRecordingCamera: false,
  webcamCoordinates: null as { x: number; y: number } | null,
  circle: true,
  size: 200,
  micPerms: false,
  cameraPerms: false,
});
export const appSettingsStorage = new SyncStorage({});

// define static methods here
export class StorageHandler {}
