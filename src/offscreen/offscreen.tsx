import {
  startRecordingChannel,
  stopRecordingChannel,
} from "../background/controllers/messages";
import { ScreenRecorder } from "./ScreenRecorder";

const screenRecorder = new ScreenRecorder();

startRecordingChannel.listenAsync(async () => {
  await screenRecorder.startRecording();
});

stopRecordingChannel.listenAsync(async () => {
  await screenRecorder.stopRecording();
});
