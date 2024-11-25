import { MessagesOneWay } from "../../chrome-api/messages";

export const startRecordingChannel = new MessagesOneWay<
  {
    recordAudio: boolean;
  },
  {
    recordingSuccess: boolean;
  }
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
  },
  undefined
>("logChannel");

// define static methods here
export class MessageHandler {}
