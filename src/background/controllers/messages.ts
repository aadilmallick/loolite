import { MessagesOneWay } from "../../chrome-api/messages";

export const startRecordingChannel = new MessagesOneWay("startRecording");
export const stopRecordingChannel = new MessagesOneWay("stopRecording");

// define static methods here
export class MessageHandler {}
