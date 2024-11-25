interface StartRecording {
  onStop?: () => void;
  onRecordingCanceled?: () => void;
}

class RecordingError extends Error {
  constructor(message: string, public stream: MediaStream) {
    super(message);
    this.name = "RecordingError";
  }

  log() {
    console.error(this.name, this.message);
    console.error("The offending stream", this.stream);
    console.error(this.stack);
  }
}

class MicNotEnabledError extends RecordingError {
  constructor(stream: MediaStream) {
    super("Mic not enabled", stream);
    this.name = "MicNotEnabledError";
  }
}

export class BasicScreenRecorder {
  stream?: MediaStream;
  recorder?: MediaRecorder;
  recorderStream?: MediaStream;
  micStream?: MediaStream;

  static async requestMicPermission() {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return result.state;
  }

  private async getStream({ recordMic }: { recordMic: boolean }) {
    const recorderStream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: true,
    });
    this.recorderStream = recorderStream;
    this.recorderStream.getTracks()[0].addEventListener("ended", async () => {
      await this.stopRecording();
    });
    console.log("recorder stream", recorderStream);
    console.log("recorder stream tracks", recorderStream.getTracks());

    // if recording window (no system audio), then just join with mic.
    if (recorderStream.getAudioTracks().length === 0) {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const combinedStream = new MediaStream([
        ...recorderStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      return combinedStream;
    }
    if (recordMic) {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      if (audioStream.getAudioTracks().length === 0) {
        throw new MicNotEnabledError(audioStream);
      }

      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Add tab audio to the destination
      const tabAudioSource =
        audioContext.createMediaStreamSource(recorderStream);
      tabAudioSource.connect(destination);

      // Add mic audio to the destination
      const micAudioSource = audioContext.createMediaStreamSource(audioStream);
      micAudioSource.connect(destination);

      const combinedStream = new MediaStream([
        ...recorderStream.getVideoTracks(),
        ...destination.stream.getTracks(),
      ]);

      return combinedStream;
    } else {
      return recorderStream;
    }
  }

  async startAudioRecording(options?: StartRecording) {
    if (this.recorder) {
      this.recorder.stop();
    }
    let audioStream: MediaStream;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch (e) {
      if (e instanceof DOMException) {
        options?.onRecordingCanceled?.();
        return false;
      }
    }
    this.stream = audioStream;
    this.recorder = new MediaRecorder(this.stream);

    // Start recording.
    this.recorder.start();
    this.recorder.addEventListener("dataavailable", async (event) => {
      let recordedBlob = event.data;
      let url = URL.createObjectURL(recordedBlob);

      let a = document.createElement("a");

      a.style.display = "none";
      a.href = url;
      a.download = "audio-recording.webm";

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      options?.onStop?.();
    });
    return true;
  }

  async startVideoRecording({
    onStop,
    recordMic = false,
    onRecordingCanceled,
    onRecordingFailed,
  }: {
    onStop?: () => void;
    recordMic?: boolean;
    onRecordingCanceled?: () => void;
    onRecordingFailed?: () => void;
  }) {
    if (this.recorder) {
      this.recorder.stop();
    }
    try {
      this.stream = await this.getStream({
        recordMic,
      });
      console.log("stream", this.stream);
    } catch (e) {
      if (e instanceof DOMException) {
        console.error(e);
        onRecordingCanceled?.();
        return false;
      } else if (e instanceof RecordingError) {
        e.log();
        onRecordingFailed?.();
        return false;
      } else {
        console.error(e);
        onRecordingFailed?.();
        return false;
      }
    }
    this.recorder = new MediaRecorder(this.stream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });

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
    // this.micStream?.getTracks().forEach((track) => track.stop());
    // this.recorderStream?.getTracks().forEach((track) => track.stop());
    this.recorder.stop();
    this.recorder = undefined;

    // this.micStream = undefined;
    // this.recorderStream = undefined;
  }
}
