import { MessagesOneWay } from "../../chrome-api/messages";

export const startRecordingChannel = new MessagesOneWay<
  {
    recordAudio: boolean;
  },
  undefined
>("startRecording");
export const stopRecordingChannel = new MessagesOneWay<
  undefined,
  {
    recordingStoppedSuccessfully: boolean;
  }
>("stopRecording");

export const currentlyRecording = new MessagesOneWay("currentlyRecording");
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

// define static methods here
export class MessageHandler {}
