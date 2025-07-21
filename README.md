
# Loolite: Screen Recorder

This is a Chrome extension for quick and easy screen recording. It allows you to record your screen, microphone, and camera.

## Technical Deep-Dive

This section provides a technical overview of the Loolite screen recorder extension, detailing its architecture, application flow, and the roles of key files.

### Core Technologies

- **React & TypeScript**: The extension's UI components (popup, options) are built with React and TypeScript, providing a modern and type-safe development experience.
- **Webpack**: The project uses Webpack for bundling the various parts of the extension (popup, background script, content scripts, etc.) into optimized JavaScript files.
- **Tailwind CSS**: The UI is styled using Tailwind CSS, a utility-first CSS framework that enables rapid and consistent styling.
- **Chrome Extension APIs**: The extension leverages various Chrome Extension APIs to interact with the browser, manage its state, and perform actions like capturing the screen and injecting scripts.

### Project Structure

The project is organized into several key directories:

- **`src/background`**: Contains the background script (`background.ts`), which acts as the central hub of the extension, managing state and communication between different components.
- **`src/popup`**: Holds the code for the extension's popup UI (`popup.tsx`), which allows users to start and stop recordings and configure settings.
- **`src/contentScript`**: Includes scripts that are injected into web pages to enable features like the camera overlay.
- **`src/offscreen`**: Contains the logic for the offscreen document (`offscreen.tsx`), which is responsible for the actual screen and camera recording.
- **`src/chrome-api`**: Provides a wrapper around the standard Chrome Extension APIs, offering a more streamlined and type-safe interface.
- **`src/static`**: Contains static assets like the `manifest.json` file and the extension's icon.

### Application Flow

1.  **User Interaction (Popup)**: The user initiates a recording by clicking the "Start Recording" button in the extension's popup (`popup.tsx`). The popup allows the user to select whether to record the microphone and/or camera.

2.  **Message Passing**: The popup sends a message to the background script (`background.ts`) to start the recording. This is done using the custom messaging system defined in `src/background/controllers/messages.ts`.

3.  **Offscreen Document**: The background script creates an offscreen document (`offscreen.html`), which is a hidden page that can use the `chrome.tabCapture` and `navigator.mediaDevices.getDisplayMedia` APIs to record the screen and audio. The `offscreen.tsx` script within this document handles the recording logic.

4.  **Screen and Camera Recording**:
    - The `LoomScreenRecorder` class (in `src/offscreen/ScreenRecorder.ts`) is used to capture the screen and microphone audio. It uses the `MediaRecorder` API to record the media streams.
    - If the user chooses to record the camera, the `CameraRecorder` class (in `src/offscreen/CameraRecorder.ts`) is used to capture the camera stream. The camera feed is then injected into the active tab as a video element.

5.  **State Management**: The recording state (e.g., whether a recording is in progress) is managed in the background script using the `appStorage` controller (in `src/background/controllers/storage.ts`). This ensures that the state is consistent across the extension.

6.  **Stopping the Recording**: When the user clicks the "Stop Recording" button, a message is sent to the offscreen document to stop the `MediaRecorder`. The recorded video is then processed, and the user is prompted to download the file.

### Key Files and Their Roles

- **`src/popup/popup.tsx`**: Manages the popup UI, allowing users to start/stop recordings and configure settings.
- **`src/background/background.ts`**: The extension's service worker, responsible for managing state, communication, and coordinating actions between different parts of the extension.
- **`src/offscreen/offscreen.tsx`**: Runs in a hidden offscreen document and handles the core screen and audio recording logic using the `LoomScreenRecorder`.
- **`src/offscreen/ScreenRecorder.ts`**: Contains the `ScreenRecorder` and `LoomScreenRecorder` classes, which encapsulate the logic for capturing the screen and microphone.
- **`src/offscreen/CameraRecorder.ts`**: Contains the `CameraRecorder` class, which handles capturing the camera feed.
- **`src/background/controllers/scriptingControllers.ts`**: Manages the injection and removal of content scripts and stylesheets, such as the camera overlay.
- **`src/static/manifest.json`**: The extension's manifest file, which defines its permissions, background script, popup, and other essential properties.
- **`webpack.common.js`**: The Webpack configuration file, which defines how the different parts of the extension are bundled.
