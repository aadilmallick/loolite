import {
  canceledRecording,
  currentlyRecording,
  notCurrentlyRecording,
  startRecordingChannel,
  stopRecordingChannel,
  logToBackground,
} from "../background/controllers/messages";
import { ScreenRecorder } from "./ScreenRecorder";

function closeOffscreenWindow() {
  setTimeout(() => {
    window.close();
  }, 750);
}

const screenRecorder = new ScreenRecorder();

startRecordingChannel.listenAsync(async ({ recordAudio }) => {
  // if already recording, don't do anything.
  const isRecording = await screenRecorder.isRecording();
  if (isRecording) {
    window.close();
    return;
  }
  const recordingSuccess = await screenRecorder.startVideoRecording({
    onStop: () => {
      logToBackground("offscreen", "recording stopped");
      notCurrentlyRecording.sendP2P(undefined);
      // canceledRecording.sendP2P(undefined);
      closeOffscreenWindow();
    },
    onRecordingCanceled: () => {
      logToBackground("offscreen", "recording canceled");
      canceledRecording.sendP2P(undefined);
      closeOffscreenWindow();
    },
    onRecordingFailed() {
      logToBackground("offscreen", "recording failed");
      canceledRecording.sendP2P(undefined);
      closeOffscreenWindow();
    },
    recordMic: recordAudio,
  });
  logToBackground("offscreen", { recordingSuccess });
  if (recordingSuccess) {
    currentlyRecording.sendP2P(undefined);
  } else {
    notCurrentlyRecording.sendP2P(undefined);
  }
});

// * this works
stopRecordingChannel.listenAsync(async (payload) => {
  // if not recording, don't do anything.
  const isRecording = await screenRecorder.isRecording();
  if (isRecording) {
    await screenRecorder.stopRecording();
    // try removing this and see if it changes anything.
    return {
      recordingStoppedSuccessfully: true,
    };
  } else {
    logToBackground("offscreen", "not recording, so not stopping");
    canceledRecording.sendP2P(undefined);
    closeOffscreenWindow();
    return {
      recordingStoppedSuccessfully: false,
    };
  }
});
