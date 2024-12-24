// import { CameraRecorder } from "../offscreen/CameraRecorder";

type ChromePermissionName =
  | PermissionName
  | "microphone"
  | "camera"
  | "local-fonts"
  | "clipboard-read"
  | "clipboard-write";

export class LocalStorageBrowser<T extends Record<string, any>> {
  constructor(private prefix: string = "") {}

  private getKey(key: keyof T & string): string {
    return this.prefix + key;
  }

  public set<K extends keyof T & string>(key: K, value: T[K]): void {
    window.localStorage.setItem(this.getKey(key), JSON.stringify(value));
  }

  public get<K extends keyof T & string>(key: K): T[K] | null {
    const item = window.localStorage.getItem(this.getKey(key));
    return item ? JSON.parse(item) : null;
  }

  public removeItem(key: keyof T & string): void {
    window.localStorage.removeItem(this.getKey(key));
  }

  public clear(): void {
    window.localStorage.clear();
  }
}

class NavigatorPermissions {
  static async checkPermission(permissionName: ChromePermissionName) {
    const result = await navigator.permissions.query({
      name: permissionName as PermissionName,
    });
    return result.state;
  }
}

class DOM {
  static createDomElement(html: string) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    return dom.body.firstElementChild as HTMLElement;
  }
  static addStyleTag(css: string) {
    const styles = document.createElement("style");
    styles.textContent = css;
    document.head.appendChild(styles);
    return styles;
  }
  static $ = (selector: string): HTMLElement | null =>
    document.querySelector(selector);
  static $$ = (selector: string): NodeListOf<HTMLElement> =>
    document.querySelectorAll(selector);

  static selectWithThrow = (selector: string): HTMLElement => {
    const el = DOM.$(selector);
    if (!el) {
      throw new Error(`Element not found: ${selector}`);
    }
    return el;
  };

  static addElementsToContainer(
    container: HTMLElement,
    elements: HTMLElement[]
  ) {
    const fragment = document.createDocumentFragment();
    elements.forEach((el) => fragment.appendChild(el));
    container.appendChild(fragment);
  }
}

function html(strings: TemplateStringsArray, ...values: any[]) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (values[i] || "");
  });
  return str;
}

function css(strings: TemplateStringsArray, ...values: any[]) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (values[i] || "");
  });
  return str;
}

const CONSTANTS = {
  STYLE_ID: "camera-iframe-video-styles",
  VIDEO_ID: "recorded-video",
};

const styles = css`
  * {
    margin: 0;
    padding: 0;
  }
  body {
    margin: 0;
    padding: 0;
    height: 100vh;
    background-color: #dfdbe5;
    overflow: hidden;
    pointer-events: none;
    position: relative;
  }

  #${CONSTANTS.VIDEO_ID} {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: none;
    background: black;
    pointer-events: none;
    transform: scaleX(-1);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-overlay {
    background-color: #222;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20;
    span {
      display: block;
      color: purple;
      border-right: 8px solid purple;
      border-top: 8px solid transparent;
      border-left: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-radius: 9999px;
      height: 4rem;
      width: 4rem;
      animation: spin 1s linear infinite;
      filter: blur(2px);
    }
  }
`;

function init() {
  const styletag = DOM.addStyleTag(styles);
  styletag.id = CONSTANTS.STYLE_ID;
  const cameraVideo = DOM.createDomElement(html`
    <video muted autoplay id="${CONSTANTS.VIDEO_ID}"></video>
  `) as HTMLVideoElement;
  const loadingOverlay = DOM.createDomElement(html`
    <div class="loading-overlay">
      <span></span>
    </div>
  `);

  document.body.appendChild(loadingOverlay);
  console.log(loadingOverlay);
  document.body.appendChild(cameraVideo);
  return {
    cameraVideo,
    loadingOverlay,
  };
}

function destroy() {
  const cameraVideo = DOM.$(`#${CONSTANTS.VIDEO_ID}`) as HTMLVideoElement;
  if (!cameraVideo) return;
  if (window.custom_stream) {
    console.log("stopping stream", window.custom_stream);
    window.custom_stream.getTracks().forEach((track) => {
      track.stop();
    });
    window.custom_stream = null;
  }
  cameraVideo.srcObject = null;
  cameraVideo.remove();
}

async function startRecording(cameraVideo: HTMLVideoElement) {
  const granted = await NavigatorPermissions.checkPermission("camera");
  if (!granted) throw new Error("Permission not granted");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
      aspectRatio: 1.7777777778,
    },
  });

  // const stream = await CameraRecorder.getBasicCameraStream({ audio: false });
  window.custom_stream = stream;
  cameraVideo.srcObject = stream;
}

function main() {
  console.log(
    "%c script running",
    "color: white; background-color: green; padding: 4px;"
  );
  const localStorageBrowser = new LocalStorageBrowser<{
    cameraActive: boolean;
  }>("camera-");
  console.log("cameraActive", localStorageBrowser.get("cameraActive"));
  console.log("stream before destorying", window.custom_stream);
  destroy();
  localStorageBrowser.set("cameraActive", false);
  console.log("stream after destorying", window.custom_stream);
  const { cameraVideo, loadingOverlay } = init();
  startRecording(cameraVideo).then(() => {
    console.log("stream after init", window.custom_stream);
    localStorageBrowser.set("cameraActive", true);
  });
  cameraVideo.addEventListener("canplay", () => {
    console.log("%c removed loading overlay", "color: purple;");
    loadingOverlay.remove();
  });
}

main();
