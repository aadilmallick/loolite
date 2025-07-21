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

export class CameraRecorder {
  stream?: MediaStream;
  recorder?: MediaRecorder;
  url?: string;

  static async checkCameraPermission() {
    const result = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });
    return result.state;
  }

  static async getBasicCameraStream({
    audio = false,
    videoDeviceId,
    audioDeviceId,
  }: {
    audio: boolean;
    videoDeviceId?: string;
    audioDeviceId?: string;
  }) {
    const recorderStream = await navigator.mediaDevices.getUserMedia({
      audio: audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
          }
        : false,
      video: {
        facingMode: "user",
        width: { min: 1024, ideal: 1280, max: 1920 },
        height: { min: 576, ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
        aspectRatio: 1.7777777778,
        deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
      },
    });
    return recorderStream;
  }

  private async getStream({
    videoDeviceId,
    audioDeviceId,
  }: {
    videoDeviceId?: string;
    audioDeviceId?: string;
  } = {}) {
    const recorderStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
      },
      video: {
        deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
      },
    });

    // if video ends, audio should too.
    recorderStream.getTracks()[0].addEventListener("ended", async () => {
      await this.stopRecording();
    });

    return recorderStream;
  }

  attachStreamToVideoElement(videoElement: HTMLVideoElement) {
    if (!this.stream) {
      throw new Error("No stream to attach to video element");
    }
    videoElement.srcObject = this.stream;
  }

  async startVideoRecording({
    onStop,
    onRecordingCanceled,
    onRecordingFailed,
    downloadStream,
    videoDeviceId,
    audioDeviceId,
  }: {
    onStop?: () => void;
    onRecordingCanceled?: () => void;
    onRecordingFailed?: () => void;
    downloadStream?: boolean;
    videoDeviceId?: string;
    audioDeviceId?: string;
  }) {
    if (this.recorder) {
      this.recorder.stop();
    }
    try {
      this.stream = await this.getStream({ videoDeviceId, audioDeviceId });
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
    this.recorder.addEventListener("dataavailable", async (event) => {
      if (downloadStream) {
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
      }
      onStop && (await onStop());
    });
    return true;
  }

  public get isRecording() {
    return Boolean(this.recorder && this.recorder.state === "recording");
  }

  static async isCameraInUse() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      if (videoDevices.length === 0) {
        return false; // No camera detected
      }

      return true;
    } catch (error: any) {
      if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        return true; // Camera is likely in use
      }
      return false; // Other error, camera might not be available
    }
  }

  static async getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    const audioDevices = devices.filter(
      (device) => device.kind === "audioinput"
    );
    return { videoDevices, audioDevices };
  }

  /**
   * For programmatically stopping the recording.
   */
  async stopRecording() {
    if (!this.stream || !this.recorder) return;
    console.log("stopping recording");
    console.log("combined stream tracks", this.stream.getTracks());
    this.stream.getTracks().forEach((track) => track.stop());
    // this.micStream?.getTracks().forEach((track) => track.stop());
    // this.recorderStream?.getTracks().forEach((track) => track.stop());
    this.recorder.stop();
    this.recorder = undefined;
    // this.micStream = undefined;
    // this.recorderStream = undefined;
  }
}
