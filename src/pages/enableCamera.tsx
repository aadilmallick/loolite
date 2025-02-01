import { css, DOM, html } from "../utils/Dom";

async function togglePictureInPicture() {
  try {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
      return;
    }

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
    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();
    await video.requestPictureInPicture();
  } catch (error) {
    console.error("Error starting picture in picture", error);
  }
}

const pageContent = html`
  <div>
    <button id="start">Toggle Picture in Picture</button>
  </div>
`;

const htmlContent = DOM.createDomElement(pageContent);
document.body.appendChild(htmlContent);

DOM.$("#start")?.addEventListener("click", togglePictureInPicture);

DOM.addStyleTag(css`
  video {
    transform: scaleX(-1);
  }
`);
