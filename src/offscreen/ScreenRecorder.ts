import { logChannel } from "../background/controllers/messages";

export class ScreenRecorder {
  stream?: MediaStream;
  recorder?: MediaRecorder;

  private async getStream({
    recordMic,
    audioStreamId,
  }: {
    recordMic: boolean;
    audioStreamId: string;
  }) {
    const recorderStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    if (recordMic) {
      // const audioStream = await navigator.mediaDevices.getUserMedia({
      //   audio: {},
      //   video: false,
      // });

      // const mixedContext = new AudioContext();
      // const mixedDest = mixedContext.createMediaStreamDestination();

      // mixedContext.createMediaStreamSource(audioStream).connect(mixedDest);
      // mixedContext.createMediaStreamSource(recorderStream).connect(mixedDest);

      // const combinedStream = new MediaStream([
      //   ...recorderStream.getVideoTracks(),
      //   ...mixedDest.stream.getTracks(),
      // ]);

      // // Add video tracks from screen stream
      // recorderStream.getVideoTracks().forEach((track) => {
      //   combinedStream.addTrack(track);
      // });

      // // Add audio tracks from audio stream
      // audioStream.getAudioTracks().forEach((track) => {
      //   combinedStream.addTrack(track);
      // });

      return recorderStream;
    } else {
      return recorderStream;
    }
  }

  async startRecording({
    onStop,
    recordMic = false,
    onRecordingCanceled,
    audioStreamId,
  }: {
    onStop?: () => void;
    recordMic?: boolean;
    onRecordingCanceled?: () => void;
    audioStreamId?: string;
  }) {
    logChannel.sendP2P({
      message: {
        recordMic,
        message: "starting recording",
      },
    });
    if (this.stream || this.recorder) {
      this.recorder.stop();
    }

    // has audio and video default enabled.
    try {
      this.stream = await this.getStream({ recordMic, audioStreamId });
      logChannel.sendP2P({
        message: this.stream,
      });
    } catch (e) {
      logChannel.sendP2P({
        message: {
          type: "error",
          error: e.message,
        },
      });
      if (e.message === "Permission denied") {
        onRecordingCanceled?.();
        return false;
      }
    }
    this.recorder = new MediaRecorder(this.stream);

    // Start recording.
    this.recorder.start();
    this.recorder.addEventListener("dataavailable", async (event) => {
      let recordedBlob = event.data;
      let url = URL.createObjectURL(recordedBlob);

      let a = document.createElement("a");

      a.style.display = "none";
      a.href = url;
      a.download = "screen-recording.webm";

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      onStop && onStop();
    });
    return true;
  }

  async isRecording() {
    return Boolean(this.recorder && this.recorder.state === "recording");
  }

  async stopRecording() {
    this.stream.getTracks().forEach((track) => track.stop());
    this.recorder.stop();
  }
}
