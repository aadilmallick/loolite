import { MessagesOneWay } from "../../chrome-api/messages";

export const startRecordingChannel = new MessagesOneWay("startRecording");
export const stopRecordingChannel = new MessagesOneWay("stopRecording");

export const currentlyRecording = new MessagesOneWay("currentlyRecording");
export const notCurrentlyRecording = new MessagesOneWay(
  "notCurrentlyRecording"
);

// define static methods here
export class MessageHandler {}
