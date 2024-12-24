export class WebAccessibleResources {
  static getFileURIForProcess(filename: string) {
    return filename;
  }

  static getFileURIForContent(filename: string) {
    return chrome.runtime.getURL(filename);
  }

  static get isAPIAvailable() {
    return chrome.runtime !== undefined;
  }
}
