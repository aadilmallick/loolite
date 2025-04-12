import {
  canceledRecording,
  currentlyRecording,
  notCurrentlyRecording,
  startRecordingChannel,
  stopRecordingChannel,
  logToBackground,
  recordCameraChannel,
} from "../background/controllers/messages";
import { ffmpegBrowser } from "./FFMPEGBrowser";
import { ScreenRecorder, LoomScreenRecorder } from "./ScreenRecorder";

function closeOffscreenWindow() {
  setTimeout(() => {
    window.close();
  }, 750);
}

const screenRecorder = new LoomScreenRecorder();

startRecordingChannel.listenAsync(async ({ recordAudio, recordCamera }) => {
  logToBackground("offscreen", { recordAudio, recordCamera });
  // if already recording, don't do anything.
  const isRecording = await screenRecorder.isRecording();
  if (isRecording) {
    window.close();
    return;
  }
  const recordingSuccess = await screenRecorder.startVideoRecording({
    onStop: async (blob) => {
      if (!ffmpegBrowser.isLoaded) {
        await ffmpegBrowser.init();
      }

      // compress webm
      const webmBlob = await ffmpegBrowser.processVideoFile(
        blob,
        "-i $input -acodec copy -vcodec copy -crf 28 -o $output",
        {
          inputFileName: "input.webm",
          outputFileName: "output.webm",
        }
      );
      ScreenRecorder.downloadBlob(webmBlob, "screen-recording.webm");

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
    recordCamera: recordCamera,
  });

  if (recordingSuccess) {
    ffmpegBrowser.init();
    currentlyRecording.sendP2P({
      withCamera: recordCamera,
    });
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
