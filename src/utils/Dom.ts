export class DOM {
  static createDomElement(html: string) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    return dom.body.firstElementChild as HTMLElement;
  }
  static addStyleTag(css: string, id?: string) {
    const styles = document.createElement("style");
    id && styles.id;
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

export function html(strings: TemplateStringsArray, ...values: any[]) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (values[i] || "");
  });
  return str;
}

export function css(strings: TemplateStringsArray, ...values: any[]) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (values[i] || "");
  });
  return str;
}

export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  wait: number = 300
) {
  let inThrottle: boolean,
    lastFn: ReturnType<typeof setTimeout>,
    lastTime: number;
  return function (this: any, ...args: any[]) {
    const context = this;
    if (!inThrottle) {
      fn.apply(context, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  } as T;
}

export class CSSVariablesManager<T = Record<string, string>> {
  constructor(private element: HTMLElement) {}

  private formatName(name: string) {
    if (name.startsWith("--")) {
      return name;
    }
    return `--${name}`;
  }

  set(name: keyof T, value: string) {
    this.element.style.setProperty(this.formatName(name as string), value);
  }

  get(name: keyof T) {
    return this.element.style.getPropertyValue(this.formatName(name as string));
  }
}

export class DOMLifecycleManager {
  static documentIsReady() {
    return new Promise<boolean>((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => resolve(true));
      } else {
        resolve(true);
      }
    });
  }

  static onWindowClosed(callback: () => void) {
    window.addEventListener("unload", callback);
  }

  static beforeWindowClosed(callback: () => void) {
    window.addEventListener("beforeunload", callback);
  }

  static get pageIsFocused() {
    return document.hasFocus();
  }

  static get pageIsVisible() {
    return !document.hidden;
  }

  static onVisibilityChange(callback: (isVisible: boolean) => void) {
    document.addEventListener("visibilitychange", () => {
      callback(this.pageIsVisible);
    });
  }

  static onMemoryAboutToUnload(callback: () => void) {
    window.addEventListener("freeze", callback);
  }

  static preventWindowClose(message: string) {
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      return message;
    });
  }
}

export class CSSVariablesManagerWithDefaultData<
  T extends Record<string, any> = Record<string, string>
> {
  constructor(private element: HTMLElement, defaultValues?: T) {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }

  private formatName(name: string) {
    if (name.startsWith("--")) {
      return name;
    }
    return `--${name}`;
  }

  set<K extends keyof T>(name: K, value: T[K]) {
    this.element.style.setProperty(
      this.formatName(name as string),
      String(value)
    );
  }

  get(name: keyof T) {
    return this.element.style.getPropertyValue(this.formatName(name as string));
  }
}

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

export class DateModel {
  /**
   *
   * @param time the timestring like 20:35 to convert into a date
   */
  static convertTimeToDate(time: string) {
    const date = new Date();
    const [hours, minutes] = time.split(":");
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date;
  }

  /**
   *
   * @param dateMillis the date in milliseconds to convert into a time string
   */
  static convertDateToTime(dateMillis: number) {
    const date = new Date(dateMillis);
    const hours = `${date.getHours()}`.padStart(2, "0");
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  static militaryToStandardTime(militaryTime: string) {
    const [hours, minutes] = militaryTime.split(":");
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hour = hour % 12 || 12;

    // Format the time string
    const formattedTime = `${hour}:${minutes.padStart(2, "0")} ${ampm}`;
    return formattedTime;
  }
}

export function createReactiveProxy<T extends string, V>(
  key: T,
  value: V,
  onSet: (newValue: V) => void
) {
  const proxy = new Proxy({ [key]: value } as Record<T, V>, {
    set(target, p, newValue, receiver) {
      onSet(newValue);
      return Reflect.set(target, p, newValue, receiver);
    },
  });
  return proxy;
}
