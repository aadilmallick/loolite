import { DOM, html } from "./Dom";

export class AbortControllerManager {
  private controller = new AbortController();

  get signal() {
    return this.controller.signal;
  }

  get isAborted() {
    return this.controller.signal.aborted;
  }

  reset() {
    this.controller = new AbortController();
  }

  abort() {
    this.controller.abort();
  }
}

export class PIPVideo {
  enterPIPAborter = new AbortControllerManager();
  exitPIPAborter = new AbortControllerManager();
  constructor(private video: HTMLVideoElement) {}

  async togglePictureInPicture() {
    try {
      // If the video is not in PiP mode, request PiP
      if (this.video !== document.pictureInPictureElement) {
        const pipWindow = await this.video.requestPictureInPicture();
      } else {
        // If the video is in PiP mode, exit PiP
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error("Error toggling Picture-in-Picture:", error);
    }
  }

  Events = {
    onEnterPictureInPicture: (cb: (event: PictureInPictureEvent) => any) => {
      this.video.addEventListener(
        "enterpictureinpicture",
        cb as EventListener,
        {
          signal: this.enterPIPAborter.signal,
        }
      );
      return cb;
    },
    onLeavePictureInPicture: (cb: (event: Event) => any) => {
      this.video.addEventListener(
        "leavepictureinpicture",
        cb as EventListener,
        {
          signal: this.exitPIPAborter.signal,
        }
      );
      return cb;
    },
    removeEnterPIPListeners: () => {
      this.enterPIPAborter.abort();
    },
    removeExitPIPListeners: () => {
      this.exitPIPAborter.abort();
    },
  };
}

export class PIPElement {
  private pipWindow: Window | null = null;
  constructor(
    private pipContainer: HTMLElement,
    private options?: {
      width: number;
      height: number;
    }
  ) {}

  static get isAPIAvailable() {
    return "documentPictureInPicture" in window;
  }

  static closePipWindow() {
    window.documentPictureInPicture?.window?.close();
  }

  static get pipWindowOpen() {
    return !!window.documentPictureInPicture.window;
  }

  static get pipWindow() {
    return window.documentPictureInPicture.window;
  }

  async togglePictureInPicture() {
    if (PIPElement.pipWindowOpen) {
      PIPElement.closePipWindow();
      return;
    }
    await this.openPipWindow();
  }

  async openPipWindow() {
    console.log(this.pipContainer.clientWidth, this.pipContainer.clientHeight);
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: this.options?.width || this.pipContainer.clientWidth,
      height: this.options?.height || this.pipContainer.clientHeight,
    });
    this.pipWindow = pipWindow;
    this.pipWindow.document.body.append(this.pipContainer);
  }

  addStylesToPipWindow(styles: string) {
    const styleTag = DOM.createDomElement(
      html`<style>
        ${styles}
      </style>`
    );
    if (!this.pipWindow) {
      return;
    }
    this.pipWindow.document.head.appendChild(styleTag);
  }

  copyStylesToPipWindow() {
    if (!this.pipWindow) {
      return;
    }
    [...document.styleSheets].forEach((styleSheet) => {
      const pipWindow = this.pipWindow!;
      try {
        const cssRules = [...styleSheet.cssRules]
          .map((rule) => rule.cssText)
          .join("");
        const style = document.createElement("style");

        style.textContent = cssRules;
        pipWindow.document.head.appendChild(style);
      } catch (e) {
        const link = document.createElement("link");

        link.rel = "stylesheet";
        link.type = styleSheet.type;
        link.href = styleSheet.href || "";
        pipWindow.document.head.appendChild(link);
      }
    });
  }

  Events = {
    onPIPWindowClose: (cb: () => void) => {
      if (!this.pipWindow) {
        return;
      }
      this.pipWindow.addEventListener("pagehide", cb);
    },
    onPIPEnter: (cb: (window: Window) => void) => {
      window.documentPictureInPicture.addEventListener(
        "enter",
        (event: DocumentPictureInPictureEvent) => {
          cb(event.window);
        }
      );
    },
  };
}
