import {
  currentlyRecording,
  notCurrentlyRecording,
  startRecordingChannel,
  stopRecordingChannel,
} from "../background/controllers/messages";
import { ScreenRecorder } from "./ScreenRecorder";

const screenRecorder = new ScreenRecorder();

startRecordingChannel.listenAsync(async () => {
  // if already recording, don't do anything.
  if (await screenRecorder.isRecording()) {
    return;
  }
  await screenRecorder.startRecording(() => {
    window.close();
  });
  currentlyRecording.sendP2P(undefined);
});

stopRecordingChannel.listenAsync(async () => {
  // if not recording, don't do anything.
  if (!(await screenRecorder.isRecording())) {
    window.close();
  }
  await screenRecorder.stopRecording();
  notCurrentlyRecording.sendP2P(undefined);
});
