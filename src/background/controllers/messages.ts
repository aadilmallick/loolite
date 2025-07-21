import { MessagesOneWay } from "../../chrome-api/messages";

export const startRecordingChannel = new MessagesOneWay<
  {
    recordAudio: boolean;
    recordCamera: boolean;
    videoDeviceId?: string;
    audioDeviceId?: string;
  },
  undefined
>("startRecording");
export const stopRecordingChannel = new MessagesOneWay<
  undefined,
  {
    recordingStoppedSuccessfully: boolean;
  }
>("stopRecording");

export const currentlyRecording = new MessagesOneWay<
  {
    withCamera: boolean;
  },
  undefined
>("currentlyRecording");
export const recordCameraChannel = new MessagesOneWay<undefined, undefined>(
  "recordCamera"
);
export const stopRecordCameraChannel = new MessagesOneWay<undefined, undefined>(
  "stopRecordCamera"
);

export const cameraStyleChannel = new MessagesOneWay<
  {
    borderColor?: string;
    borderPreset?: "rainbow" | "none";
    glowLevel?: "high" | "medium" | "low" | "none";
  },
  undefined
>("cameraStyleChannel");

export const canceledRecording = new MessagesOneWay("canceledRecording");
export const notCurrentlyRecording = new MessagesOneWay(
  "notCurrentlyRecording"
);

export const logChannel = new MessagesOneWay<
  {
    message: any;
    sender: "popup" | "offscreen";
  },
  undefined
>("logChannel");

export function logToBackground(sender: "popup" | "offscreen", message: any) {
  console.log(message);
  logChannel.sendP2P({
    message,
    sender,
  });
}

export const setVideoDeviceIdChannel = new MessagesOneWay<string, undefined>(
  "set-video-device-id"
);
export const setAudioDeviceIdChannel = new MessagesOneWay<string, undefined>(
  "set-audio-device-id"
);

// define static methods here
export class MessageHandler {}
