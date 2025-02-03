interface Window {
  custom_stream: MediaStream | null;
}

// interface DocumentPictureInPicture {
//   // The current Picture-in-Picture window if one is open; otherwise, null.
//   readonly window: Window | null;

//   // Requests a new Picture-in-Picture window with optional configuration.
//   requestWindow(options?: PictureInPictureWindowOptions): Promise<Window>;
// }

interface DocumentPictureInPicture {
  // The current Picture-in-Picture window if one is open; otherwise, null.
  readonly window: Window | null;

  // Requests a new Picture-in-Picture window with optional configuration.
  requestWindow(options?: PictureInPictureWindowOptions): Promise<Window>;

  addEventListener(
    type: "enter",
    listener: (event: DocumentPictureInPictureEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface PictureInPictureWindowOptions {
  // The initial width of the Picture-in-Picture window.
  width?: number;

  // The initial height of the Picture-in-Picture window.
  height?: number;

  // If true, hides the "back to tab" button in the Picture-in-Picture window.
  disallowReturnToOpener?: boolean;

  // If true, opens the Picture-in-Picture window in its default position and size.
  preferInitialWindowPlacement?: boolean;
}

interface Window {
  // The DocumentPictureInPicture object for the current document context.
  readonly documentPictureInPicture: DocumentPictureInPicture;
}

interface DocumentPictureInPictureEvent extends Event {
  // The Picture-in-Picture window associated with the event.
  readonly window: Window;
}
declare var documentPictureInPicture: DocumentPictureInPicture;
