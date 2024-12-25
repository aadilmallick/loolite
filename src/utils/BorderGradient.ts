export type GlowLevel = "low" | "medium" | "high" | "none";

export const exampleBorderGradientStyles = {
  rainbow: `
            background-image: conic-gradient(
                from var(--angle),
                #ff4545,
                #00ff99,
                #006aff,
                #ff0095,
                #ff4545
            )
        `,
  blueTransparent: `
            background-image: conic-gradient(
                from var(--angle),
                transparent 70%,
                blue
            )
        `,
  blueGradient: `
            background-image: conic-gradient(
                from var(--angle),
                lightblue,
                blue
            )
        `,
};

class DOMClassManipulator {
  static addCSS(id: string, css: string) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  static removeStyles(id: string) {
    const styles = document.getElementById(id);
    if (styles) {
      styles.remove();
    }
  }
}

export class BorderGradientModel {
  private selector!: string;
  private element: HTMLElement;

  private getStaticCSS({
    glowLevel = "low",
    borderRadius,
    conicGradient,
    gradientThickness = "medium",
  }: {
    conicGradient: string;
    borderRadius: string;
    glowLevel?: GlowLevel;
    gradientThickness?: "thin" | "medium" | "thick";
  }) {
    const filterBlurLevel =
      glowLevel === "none"
        ? "0"
        : glowLevel === "low"
        ? "0.2"
        : glowLevel === "medium"
        ? "0.5"
        : "1";
    const gradientThicknessValue =
      gradientThickness === "thin"
        ? "2px"
        : gradientThickness === "medium"
        ? "4px"
        : "6px";
    const cssContent = `
                ${this.selector}::after,
                ${this.selector}::before {
                        content: "";
                        position: absolute;
                        height: 100%;
                        width: 100%;
                        ${conicGradient};
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: -1;
                        padding: ${gradientThicknessValue};
                        border-radius: ${borderRadius};
                    }
                    ${this.selector}::before {
                        filter: blur(1.5rem);
                        opacity: ${filterBlurLevel};
                    }
                `;
    return cssContent;
  }

  private getCSS({
    glowLevel = "low",
    animationDurationInSeconds = 3,
    borderRadius,
    conicGradient,
    gradientThickness = "medium",
  }: {
    conicGradient: string;
    borderRadius: string;
    animationDurationInSeconds?: number;
    glowLevel?: GlowLevel;
    gradientThickness?: "thin" | "medium" | "thick";
  }) {
    const filterGlowLevel =
      glowLevel === "none"
        ? "0"
        : glowLevel === "low"
        ? "0.2"
        : glowLevel === "medium"
        ? "0.5"
        : "1";
    const gradientThicknessValue =
      gradientThickness === "thin"
        ? "2px"
        : gradientThickness === "medium"
        ? "4px"
        : "6px";
    const cssContent = `
                @property --angle {
                    syntax: "<angle>";
                    initial-value: 0deg;
                    inherits: false;
                }
        
            ${this.selector}::after,
            ${this.selector}::before {
                    content: "";
                    position: absolute;
                    height: 100%;
                    width: 100%;
                    ${conicGradient};
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: -1;
                    padding: ${gradientThicknessValue};
                    border-radius: ${borderRadius};
                    animation: ${animationDurationInSeconds}s spin linear infinite;
                }
            ${this.selector}::before {
                    filter: blur(1.5rem);
                    opacity: ${filterGlowLevel};
                }
                @keyframes spin {
                    from {
                        --angle: 0deg;
                    }
                    to {
                        --angle: 360deg;
                    }
                }
            `;
    return cssContent;
  }

  private prepareElement(element: HTMLElement) {
    const position = window.getComputedStyle(element).position;
    if (position === "static") {
      throw new Error("Element must have a position other than static");
    }
    const borderRadius = window.getComputedStyle(element).borderRadius;
    if (!element.id) {
      const newId = crypto.randomUUID();
      element.id = newId;
      this.selector = `#${newId}`;
    } else {
      this.selector = `#${element.id}`;
    }
    return { borderRadius };
  }

  constructor(
    selector: string | HTMLElement,
    gradientMaker: BorderGradientMaker | StaticBorderGradientMaker,
    options?: {
      animationDurationInSeconds?: number;
      glowLevel?: GlowLevel;
      gradientThickness?: "thin" | "medium" | "thick";
    }
  ) {
    let element: HTMLElement;
    if (typeof selector === "string") {
      element = document.querySelector(selector) as HTMLElement;
      this.selector = selector;
      if (!element) {
        throw new Error(`Element with selector ${selector} not found`);
      }
    } else {
      element = selector;
      if (!element) {
        throw new Error(`Element ${element} not found`);
      }
    }
    this.element = element;
    if (gradientMaker.key === "animated") {
      this.createAnimatedGradient(gradientMaker, options);
    } else {
      this.createStaticGradient(gradientMaker, options);
    }
  }

  private createAnimatedGradient(
    gradientMaker: BorderGradientMaker,
    options?: {
      animationDurationInSeconds?: number;
      glowLevel?: GlowLevel;
      gradientThicknessValue?: "thin" | "medium" | "thick";
    }
  ) {
    const { borderRadius } = this.prepareElement(this.element);
    const gradientStyles = gradientMaker.createConicGradientStyles();

    const css = this.getCSS({
      conicGradient: gradientStyles,
      borderRadius,
      animationDurationInSeconds: options?.animationDurationInSeconds,
      glowLevel: options?.glowLevel,
      gradientThickness: options?.gradientThicknessValue,
    });
    DOMClassManipulator.addCSS(
      `border-gradient-styles-${this.element.id}`,
      css
    );
  }

  static removeStyles(elementId: string) {
    DOMClassManipulator.removeStyles(`border-gradient-styles-${elementId}`);
  }

  removeStyles() {
    DOMClassManipulator.removeStyles(
      `border-gradient-styles-${this.element.id}`
    );
  }

  private createStaticGradient(
    gradientMaker: StaticBorderGradientMaker,
    options?: {
      glowLevel?: GlowLevel;
      gradientThicknessValue?: "thin" | "medium" | "thick";
    }
  ) {
    const { borderRadius } = this.prepareElement(this.element);
    const gradientStyles = gradientMaker.createConicGradientStyles();

    const css = this.getStaticCSS({
      conicGradient: gradientStyles,
      borderRadius,
      gradientThickness: options?.gradientThicknessValue,
      glowLevel: options?.glowLevel,
    });

    DOMClassManipulator.addCSS(
      `border-gradient-styles-${this.element.id}`,
      css
    );
  }
}

export class BorderGradientFactory {
  static createClosedCustomGradient(
    selector: string | HTMLElement,
    colorStops: string[],
    options?: {
      animationDurationInSeconds?: number;
      blurLevel?: GlowLevel;
      gradientThicknessValue?: "thin" | "medium" | "thick";
    }
  ) {
    return new BorderGradientModel(
      selector,
      new ClosedCustomGradientMaker(colorStops),
      options
    );
  }

  static createOpenCustomGradient(
    selector: string | HTMLElement,
    colorStops: string[],
    sliverPercent = 0.7,
    options?: {
      animationDurationInSeconds?: number;
      glowLevel?: GlowLevel;
      gradientThicknessValue?: "thin" | "medium" | "thick";
    }
  ) {
    return new BorderGradientModel(
      selector,
      new OpenCustomGradientMaker(colorStops, sliverPercent),
      options
    );
  }

  static createPresetGradient(
    selector: string | HTMLElement,
    gradientType: keyof typeof exampleBorderGradientStyles,
    options?: {
      animationDurationInSeconds?: number;
      glowLevel?: GlowLevel;
      gradientThicknessValue?: "thin" | "medium" | "thick";
    }
  ) {
    return new BorderGradientModel(
      selector,
      new PresetGradientMaker(gradientType),
      options
    );
  }

  static createStaticPresetGradient(
    selector: string | HTMLElement,
    gradientType: keyof typeof exampleBorderGradientStyles,
    options?: {
      glowLevel?: GlowLevel;
      gradientThicknessValue?: "thin" | "medium" | "thick";
    }
  ) {
    return new BorderGradientModel(
      selector,
      new StaticPresetGradientMaker(gradientType),
      options
    );
  }

  static createStaticCustomGradient(
    selector: string | HTMLElement,
    gradientType: keyof typeof exampleBorderGradientStyles,
    options?: {
      glowLevel?: GlowLevel;
      gradientThicknessValue?: "thin" | "medium" | "thick";
    }
  ) {
    return new BorderGradientModel(
      selector,
      new StaticCustomGradientMaker(gradientType),
      options
    );
  }
}

interface BorderGradientMaker {
  createConicGradientStyles: () => string;
  key: "animated";
}

interface StaticBorderGradientMaker {
  createConicGradientStyles: () => string;
  key: "static";
}

class ClosedCustomGradientMaker implements BorderGradientMaker {
  key = "animated" as const;
  constructor(private colorStops: string[]) {
    if (colorStops.length < 2) {
      throw new Error("At least two color stops are required");
    }
  }
  createConicGradientStyles() {
    const string = `
                background-image: conic-gradient(
                    from var(--angle),
                    ${this.colorStops.join(", ")},
                    ${this.colorStops[0]}
                )
            `;
    return string;
  }
}

class OpenCustomGradientMaker implements BorderGradientMaker {
  key = "animated" as const;

  constructor(private colorStops: string[], private sliverPercent = 0.7) {
    if (sliverPercent < 0.1 || sliverPercent > 0.9) {
      throw new Error("Sliver percent must be between 0.1 and 0.9");
    }
    if (colorStops.length < 1) {
      throw new Error("At least one color is required");
    }
  }
  createConicGradientStyles() {
    const string = `
                  background-image: conic-gradient(
                      from var(--angle),
                      transparent ${Math.floor(this.sliverPercent * 100)}%,
                      ${this.colorStops.join(", ")},
                      transparent
                  )
              `;
    return string;
  }
}

class PresetGradientMaker implements BorderGradientMaker {
  key = "animated" as const;

  constructor(private gradientType: keyof typeof exampleBorderGradientStyles) {}
  createConicGradientStyles() {
    return exampleBorderGradientStyles[this.gradientType];
  }
}

class StaticPresetGradientMaker implements StaticBorderGradientMaker {
  key = "static" as const;

  constructor(private gradientType: keyof typeof exampleBorderGradientStyles) {}
  createConicGradientStyles() {
    return exampleBorderGradientStyles[this.gradientType];
  }
}

class StaticCustomGradientMaker implements StaticBorderGradientMaker {
  key = "static" as const;

  constructor(private gradientType: keyof typeof exampleBorderGradientStyles) {}
  createConicGradientStyles() {
    return exampleBorderGradientStyles[this.gradientType];
  }
}
