import {
  canceledRecording,
  currentlyRecording,
  logChannel,
  notCurrentlyRecording,
  startRecordingChannel,
  stopRecordingChannel,
} from "../background/controllers/messages";
import { ScreenRecorder } from "./ScreenRecorder";

const screenRecorder = new ScreenRecorder();

startRecordingChannel.listenAsync(async ({ recordAudio }) => {
  // if already recording, don't do anything.
  const isRecording = await screenRecorder.isRecording();
  if (isRecording) {
    window.close();
    return;
  }
  const recordingSuccess = await screenRecorder.startRecording({
    onStop: () => {
      window.close();
    },
    onRecordingCanceled: () => {
      window.close();
    },
    recordMic: recordAudio,
  });
  if (recordingSuccess) {
    currentlyRecording.sendP2P(undefined);
  } else {
    canceledRecording.sendP2P(undefined);
  }
});

stopRecordingChannel.listenAsync(async () => {
  // if not recording, don't do anything.
  const isRecording = await screenRecorder.isRecording();
  logChannel.sendP2P({
    message: "in stoprecording channel is recording: " + isRecording,
  });
  if (isRecording) {
    await screenRecorder.stopRecording();
    notCurrentlyRecording.sendP2P(undefined);
  } else {
    logChannel.sendP2P({ message: "not recording, so not stopping" });
    window.close();
  }
});
