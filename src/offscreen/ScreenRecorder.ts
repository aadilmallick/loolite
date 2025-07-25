import { fixWebmDuration } from "@fix-webm-duration/fix";

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
  protected recorder?: MediaRecorder;
  protected recorderStream?: MediaStream;
  protected chunks: Blob[] = [];
  micStream?: MediaStream;
  protected startTime?: number;

  static async checkMicPermission() {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return result.state;
  }

  protected async getStream({
    recordMic,
    videoDeviceId,
    audioDeviceId,
  }: {
    recordMic: boolean;
    videoDeviceId?: string;
    audioDeviceId?: string;
  }) {
    const recorderStream = await navigator.mediaDevices.getDisplayMedia({
      audio: recordMic,
      video: true,
    });
    this.recorderStream = recorderStream;
    this.recorderStream.getTracks()[0].addEventListener("ended", async () => {
      await this.stopRecording();
    });
    // If recording window (no system audio), then just join with mic.
    if (recorderStream.getAudioTracks().length === 0 && recordMic) {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: false,
      });
      const combinedStream = new MediaStream([
        ...recorderStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      return combinedStream;
    } else if (recordMic) {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: false,
      });
      if (audioStream.getAudioTracks().length === 0) {
        throw new MicNotEnabledError(audioStream);
      }
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      const tabAudioSource =
        audioContext.createMediaStreamSource(recorderStream);
      tabAudioSource.connect(destination);
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
    async function tryGetUserMedia() {
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
    const stream = await tryGetUserMedia();
    if (stream === null) return false;
    this.stream = stream;
    this.recorder = new MediaRecorder(this.stream!);

    // Start recording.
    this.recorder.start();
    this.startTime = Date.now();

    this.recorder.addEventListener("dataavailable", async (event) => {
      let recordedBlob = event.data;
      this.chunks.push(recordedBlob);
    });

    this.recorder.addEventListener("stop", async () => {
      const giantBlob = new Blob(this.chunks);
      let blob: Blob = giantBlob;
      if (this.startTime) {
        const duration = Date.now() - this.startTime;
        blob = await fixWebmDuration(giantBlob, duration);
      }
      ScreenRecorder.downloadBlob(blob, "audio-recording.webm");
      await options?.onStop?.();
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
    videoDeviceId,
    audioDeviceId,
  }: {
    onStop?: () => void;
    recordMic?: boolean;
    onRecordingCanceled?: () => void;
    onRecordingFailed?: () => void;
    videoDeviceId?: string;
    audioDeviceId?: string;
  }) {
    if (this.recorder) {
      this.recorder.stop();
    }
    try {
      this.stream = await this.getStream({
        recordMic,
        videoDeviceId,
        audioDeviceId,
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
      mimeType: "video/webm; codecs=vp9",
    });
    this.recorder.start();
    this.startTime = Date.now();
    this.recorder.addEventListener("dataavailable", (event) => {
      let recordedBlob = event.data;
      this.chunks.push(recordedBlob);
    });
    this.recorder.addEventListener("stop", async () => {
      const giantBlob = new Blob(this.chunks);
      let blob: Blob = giantBlob;
      if (this.startTime) {
        const duration = Date.now() - this.startTime;
        blob = await fixWebmDuration(giantBlob, duration);
      }
      ScreenRecorder.downloadBlob(blob, "screen-recording.webm");
      await onStop?.();
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

export class LoomScreenRecorder extends ScreenRecorder {
  protected async getStream({
    recordMic,
    recordCamera,
    videoDeviceId,
    audioDeviceId,
  }: {
    recordMic: boolean;
    recordCamera: boolean;
    videoDeviceId?: string;
    audioDeviceId?: string;
  }) {
    const recorderStream = await navigator.mediaDevices.getDisplayMedia({
      audio: recordMic,
      video: recordCamera
        ? {
            displaySurface: "monitor",
          }
        : true,
    });
    this.recorderStream = recorderStream;
    this.recorderStream.getTracks()[0].addEventListener("ended", async () => {
      await this.stopRecording();
    });
    if (recorderStream.getAudioTracks().length === 0 && recordMic) {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: false,
      });
      const combinedStream = new MediaStream([
        ...recorderStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      return combinedStream;
    } else if (recordMic) {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: false,
      });
      if (audioStream.getAudioTracks().length === 0) {
        throw new MicNotEnabledError(audioStream);
      }
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      const tabAudioSource =
        audioContext.createMediaStreamSource(recorderStream);
      tabAudioSource.connect(destination);
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

  async startVideoRecording({
    onStop,
    recordMic = false,
    onRecordingCanceled,
    onRecordingFailed,
    recordCamera = false,
    videoDeviceId,
    audioDeviceId,
  }: {
    onStop?: () => void;
    recordMic?: boolean;
    onRecordingCanceled?: () => void;
    onRecordingFailed?: () => void;
    recordCamera?: boolean;
    videoDeviceId?: string;
    audioDeviceId?: string;
  }) {
    if (this.recorder) {
      this.recorder.stop();
    }
    try {
      this.stream = await this.getStream({
        recordMic,
        recordCamera,
        videoDeviceId,
        audioDeviceId,
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
      mimeType: "video/webm; codecs=vp9",
    });
    this.recorder.start();
    this.startTime = Date.now();
    this.recorder.addEventListener("dataavailable", (event) => {
      let recordedBlob = event.data;
      this.chunks.push(recordedBlob);
    });
    this.recorder.addEventListener("stop", async () => {
      const giantBlob = new Blob(this.chunks);
      let blob: Blob = giantBlob;
      if (this.startTime) {
        const duration = Date.now() - this.startTime;
        blob = await fixWebmDuration(giantBlob, duration);
      }
      ScreenRecorder.downloadBlob(blob, "screen-recording.webm");
      await onStop?.();
    });
    return true;
  }
}
