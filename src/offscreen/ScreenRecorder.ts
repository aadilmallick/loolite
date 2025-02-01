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

export class ScreenRecorder {
  stream?: MediaStream;
  private recorder?: MediaRecorder;
  private recorderStream?: MediaStream;
  private chunks: Blob[] = [];
  micStream?: MediaStream;

  static async checkMicPermission() {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return result.state;
  }

  private async getStream({ recordMic }: { recordMic: boolean }) {
    const recorderStream = await navigator.mediaDevices.getDisplayMedia({
      audio: recordMic,
      video: true,
    });
    this.recorderStream = recorderStream;

    // if video ends, audio should too.
    this.recorderStream.getTracks()[0].addEventListener("ended", async () => {
      await this.stopRecording();
    });

    // if recording window (no system audio), then just join with mic.
    if (recorderStream.getAudioTracks().length === 0 && recordMic) {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const combinedStream = new MediaStream([
        ...recorderStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      return combinedStream;
    } else if (recordMic) {
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
    async function shitBitch() {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        return audioStream;
      } catch (e) {
        if (e instanceof DOMException) {
          options?.onRecordingCanceled?.();
          return null;
        }
      }
    }
    const stream = await shitBitch();
    if (stream === null) return false;
    this.stream = stream;
    this.recorder = new MediaRecorder(this.stream!);

    // Start recording.
    this.recorder.start();
    this.recorder.addEventListener("dataavailable", async (event) => {
      let recordedBlob = event.data;
      this.chunks.push(recordedBlob);
    });
    this.recorder.addEventListener("stop", () => {
      const giantBlob = new Blob(this.chunks);
      ScreenRecorder.downloadBlob(giantBlob, "audio-recording.webm");
      options?.onStop?.();
    });
    return true;
  }

  static downloadBlob(blob: Blob, filename: string) {
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");

    a.style.display = "none";
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  static getScreenRecordingType(stream: MediaStream) {
    if (!stream || !stream.getVideoTracks().length) {
      throw new Error(
        "No video tracks found in stream when getting screen recording type"
      );
    }
    return stream.getVideoTracks()[0].getSettings().displaySurface as
      | "monitor"
      | "window"
      | "browser";
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
    } catch (e) {
      if (e instanceof DOMException) {
        console.warn("Permission denied: user canceled recording");
        await onRecordingCanceled?.();
        return false;
      } else if (e instanceof RecordingError) {
        e.log();
        await onRecordingFailed?.();
        return false;
      } else {
        console.error(e);
        await onRecordingFailed?.();
        return false;
      }
    }
    this.recorder = new MediaRecorder(this.stream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });
    // Start recording.
    this.recorder.start();
    this.recorder.addEventListener("dataavailable", (event) => {
      let recordedBlob = event.data;
      this.chunks.push(recordedBlob);
    });
    this.recorder.addEventListener("stop", () => {
      const giantBlob = new Blob(this.chunks);
      ScreenRecorder.downloadBlob(giantBlob, "screen-recording.webm");
      onStop?.();
    });
    return true;
  }

  async isRecording() {
    return Boolean(this.recorder && this.recorder.state === "recording");
  }

  /**
   * For programmatically stopping the recording.
   */
  async stopRecording() {
    if (!this.recorder || !this.stream) return;
    console.log("stopping recording");
    console.log("combined stream tracks", this.stream.getTracks());
    this.stream.getTracks().forEach((track) => track.stop());
    this.recorder.stop();
    this.recorder = undefined;
    this.chunks = [];
  }
}
