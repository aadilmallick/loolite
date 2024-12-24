import Scripting from "../../chrome-api/scripting";
import Tabs from "../../chrome-api/tabs";
import { WebAccessibleResources } from "../../chrome-api/webAccessibleResources";

export async function removeCamera(tabId: number) {
  await Scripting.executeFunctionNoArgs(tabId, async () => {
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

    const styles = DOM.$("#content-script-ui-camera-iframe-styles");
    if (styles) {
      styles.remove();
    }

    const videoFrame = DOM.$(".shit-another-container");
    console.log("scrptingcontroller: videoFrame to remove", videoFrame);
    if (videoFrame) {
      videoFrame.remove();
    }
  });
}

export async function injectCamera(tabId: number) {
  Scripting.executeScripts(
    tabId,
    WebAccessibleResources.getFileURIForProcess("camera.js"),
    "ISOLATED"
  );
}

export async function injectCameraIntoCurrentTab() {
  const tab = await Tabs.getCurrentTab();
  console.log(tab);
  if (!tab) throw new Error("no tab");
  await injectCamera(tab.id!);
}
export async function getAllScriptableTabs() {
  const tabs = await Tabs.getAllTabs({
    allWindows: true,
  });
  return tabs
    .filter((tab) => tab.url)
    .filter((tab) => tab.url!.startsWith("http"))
    .filter((tab) => !tab.url!.startsWith("https://chrome.google.com/webstore"))
    .map((tab) => tab.id);
}
