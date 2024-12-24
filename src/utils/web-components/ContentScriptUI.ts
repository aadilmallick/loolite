import {
  css,
  CSSVariablesManager,
  CSSVariablesManagerWithDefaultData,
  DOM,
  html,
} from "../Dom";
import WebComponent from "./WebComponent";

interface StaticProps {
  "data-iframe-url": string;
}

const observableAttributes = [] as readonly string[];
export class ContentScriptUI extends WebComponent {
  static tagName = "content-script-ui" as const;
  static cameraId = "ez-screen-recorder-camera" as const;
  static elementContainerName = "camera-iframe-container" as const;
  static width = 200;
  static height = 200;

  constructor() {
    super({
      templateId: ContentScriptUI.tagName,
    });
  }

  static override get CSSContent() {
    return css`
      #camera-iframe-container {
        user-select: none;
        width: var(--cameraSize, 200px);
        height: var(--cameraSize, 200px);
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
        user-select: none;
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
        user-select: none;
      }

      #placeholder {
        visibility: hidden;
        position: absolute;
        transform: translate(-600%, -600%);
      }

      #camera-iframe-container #actions {
        position: absolute;
        top: 0;
        left: 0;
        user-select: none;
        width: 100%;
        height: 100%;
        opacity: 0;
        pointer-events: none;
        background-color: rgba(57, 57, 57, 0.5);
        transition: opacity 0.3s;
        border-radius: 9999px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        z-index: 9000;

        p {
          max-width: 25ch;
          line-height: 1.5;
          color: rgba(208, 208, 208, 0.8);
          font-weight: 600;
          font-size: 1rem;
          margin: 0;
          padding: 0;
          text-align: center;
        }

        button {
          border: none;
          background: none;
          cursor: pointer;
          transition: opacity 0.3s;
          font-size: 1.2rem;
          user-select: none;
          &:hover {
            opacity: 0.7;
          }
        }
      }

      #camera-iframe-container .iframe-container:hover #actions {
        opacity: 1;
        pointer-events: all;
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
            <div id="actions">
              <p>Double Click to grow</p>
              <!--
              <button id="grow">⬆️</button>
              <button id="shrink">🔽</button>
            -->
            </div>
            <iframe
              allow="camera; microphone; fullscreen; display-capture; autoplay; encrypted-media; picture-in-picture;"
              width="100%"
              height="100%"
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

  private variablesManager: CSSVariablesManagerWithDefaultData<{
    cameraSize: `${number}px`;
  }>;

  private onGrow: () => void;
  private onShrink: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    console.log("%c connected callback called", "font-size: 2rem;");
    const iframeSrc = this.getAttribute("data-iframe-url");
    if (!iframeSrc) {
      throw new Error("data-iframe-url attribute is required");
    }
    if (!this.$throw("iframe").src) {
      this.$throw("iframe").src = iframeSrc;
    }

    this.variablesManager = new CSSVariablesManagerWithDefaultData(
      this.$throw("#camera-iframe-container"),
      {
        cameraSize: "200px",
      }
    );
    this.onGrow = this.onResize.bind(this, 20);
    this.onShrink = this.onResize.bind(this, -20);

    this.$throw("#grow").addEventListener("click", this.onGrow);
    this.$throw("#shrink").addEventListener("click", this.onShrink);
  }

  private onResize(amount: number, event: MouseEvent) {
    event.stopPropagation();
    const size = ContentScriptUI.width;
    const newSize = size + amount;
    console.log("%c in on resize", "color: blue; font-size: 1rem;", newSize);
    this.variablesManager.set("cameraSize", `${newSize}px`);
    // this.$throw("iframe").width = `${newSize}`;
    // this.$throw("iframe").height = `${newSize}`;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.$throw("#grow").removeEventListener("click", this.onGrow);
    this.$throw("#shrink").removeEventListener("click", this.onShrink);
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
