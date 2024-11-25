import {
  canceledRecording,
  currentlyRecording,
  logChannel,
  notCurrentlyRecording,
  startRecordingChannel,
  stopRecordingChannel,
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
    return {
      recordingSuccess: true,
    };
  }
  const recordingSuccess = await screenRecorder.startVideoRecording({
    onStop: () => {
      console.log("recording stopped");
      notCurrentlyRecording.sendP2P(undefined);
      closeOffscreenWindow();
    },
    onRecordingCanceled: () => {
      console.log("recording canceled");
      canceledRecording.sendP2P(undefined);
      closeOffscreenWindow();
    },
    onRecordingFailed() {
      console.log("recording failed");
      canceledRecording.sendP2P(undefined);
      closeOffscreenWindow();
    },
    recordMic: recordAudio,
  });
  return {
    recordingSuccess,
  };
});

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
    closeOffscreenWindow();
    return {
      recordingStoppedSuccessfully: false,
    };
  }
});
