export class ScreenRecorder {
  stream?: MediaStream;
  recorder?: MediaRecorder;

  async startRecording(onStop?: () => void) {
    if (this.stream || this.recorder) {
      this.recorder.stop();
    }

    // has audio and video default enabled.
    this.stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: true,
    });
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
  }

  async isRecording() {
    return this.recorder && this.recorder.state === "recording";
  }

  async stopRecording() {
    this.stream.getTracks().forEach((track) => track.stop());
    this.recorder.stop();
  }
}
