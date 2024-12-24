import { css, CSSVariablesManager, DOM, html } from "../Dom";
import WebComponent from "./WebComponent";

interface StaticProps {
  "data-iframe-url": string;
}

const observableAttributes = [] as readonly string[];
export class ContentScriptUI extends WebComponent {
  static tagName = "content-script-ui" as const;
  static cameraId = "ez-screen-recorder-camera" as const;
  static elementContainerName = "camera-iframe-container" as const;

  constructor() {
    super({
      templateId: ContentScriptUI.tagName,
    });
  }

  static override get CSSContent() {
    return css`
      #camera-iframe-container {
        width: 200px;
        height: 200px;
        position: fixed;
        bottom: 0;
        right: 0;
        border-radius: 9999px;
        border: 4px solid rebeccapurple;
        z-index: 5000;
        cursor: grab;
        resize: both;
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
      }

      #camera-iframe-container .draggable-handle {
        background-color: #fff;
        border: 2px solid gray;
        width: 3rem;
        height: 1.5rem;
        border-radius: 1rem;
        position: absolute;
        top: 50%;
        left: 0;
        transform: translate(-50%, -50%);
        display: block;
        z-index: -1;
        cursor: grab;
      }

      #camera-iframe-container .iframe-container {
        overflow: hidden;
        background-color: black;
        width: 100%;
        height: 100%;
        border-radius: 9999px;
      }

      #camera-iframe-container iframe {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: none;
        pointer-events: none;
      }

      #placeholder {
        visibility: hidden;
        position: absolute;
        transform: translate(-600%, -600%);
      }
    `;
  }

  static registerSelf() {
    if (!customElements.get(this.tagName)) {
      WebComponent.register(this.tagName, this);
    }
  }

  static override get HTMLContent() {
    return html`
      <div class="shit-another-container">
        <div id="placeholder"></div>
        <div id="camera-iframe-container">
          <!-- <div class="draggable-handle"></div> -->
          <div class="iframe-container">
            <iframe
              allow="camera; microphone; fullscreen; display-capture; autoplay; encrypted-media; picture-in-picture;"
              width="200"
              height="200"
              id="${this.cameraId}"
            ></iframe>
          </div>
        </div>
      </div>
    `;
  }

  static manualCreation(iframeSrc: string) {
    // 1) add css
    const styles = document.createElement("style");
    styles.textContent = this.CSSContent;
    styles.id = `${this.tagName}-camera-iframe-styles`;

    console.log("styles", styles);
    document.head.appendChild(styles);

    // 2) add iframe
    const videoFrame = DOM.createDomElement(this.HTMLContent);
    console.log("videoFrame", videoFrame);
    videoFrame.querySelector("iframe").src = iframeSrc;
    // videoFrame
    //   .querySelector("iframe")
    //   .setAttribute("sandbox", "allow-scripts allow-same-origin");
    document.body.appendChild(videoFrame);

    return videoFrame;
  }

  static manualDestruction() {
    const styles = DOM.$(`#${this.tagName}-camera-iframe-styles`);
    if (styles) {
      styles.remove();
    }

    const videoFrame = DOM.$(".shit-another-container");
    console.log("content script: videoFrame to remove", videoFrame);
    if (videoFrame) {
      videoFrame.remove();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const iframeSrc = this.getAttribute("data-iframe-url");
    if (!iframeSrc) {
      throw new Error("data-iframe-url attribute is required");
    }
    this.$throw("iframe").src = iframeSrc;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [ContentScriptUI.tagName]: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & StaticProps,
        HTMLElement
      >;
    }
  }
}
