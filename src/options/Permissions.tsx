import React, { useEffect, useState } from "react";
import { appStorage } from "../background/controllers/storage";
import { CameraRecorder } from "../offscreen/CameraRecorder";
import { NavigatorPermissions } from "../offscreen/NavigatorPermissions";
import { ScreenRecorder } from "../offscreen/ScreenRecorder";
import { ToastManager } from "./Toast";

interface PermissionsProps {
  toast: ToastManager;
}

export const Permissions: React.FC<PermissionsProps> = ({ toast }) => {
  const [micPerms, setMicPerms] = useState(false);
  const [cameraPerms, setCameraPerms] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const micPermission = await appStorage.get("micPerms");
      const cameraPermission = await appStorage.get("cameraPerms");
      setMicPerms(micPermission);
      setCameraPerms(cameraPermission);
    };
    checkPermissions();
  }, []);

  const checkCameraPermission = async () => {
    const permission = await navigator.permissions.query({ name: "camera" });
    if (permission.state === "granted") {
      await appStorage.set("cameraPerms", true);
      setCameraPerms(true);
      toast.success("Camera permissions granted");
    } else {
      const cameraRecorder = new CameraRecorder();
      const success = await cameraRecorder.startVideoRecording({
        onStop: () => {},
      });
      if (!success) {
        toast.danger("Camera permissions denied");
        await appStorage.set("cameraPerms", false);
        setCameraPerms(false);
        return;
      }
      await cameraRecorder.stopRecording();
      await appStorage.set("cameraPerms", true);
      setCameraPerms(true);
    }
  };

  const checkMicPermission = async () => {
    const permission = await navigator.permissions.query({
      name: "microphone",
    });
    if (permission.state === "granted") {
      await appStorage.set("micPerms", true);
      setMicPerms(true);
      toast.success("Mic permissions granted");
    } else {
      const screenRecorder = new ScreenRecorder();
      const success = await screenRecorder.startAudioRecording({
        onStop: () => {},
      });
      if (!success) {
        toast.danger("mic permissions denied");
        await appStorage.set("micPerms", false);
        setMicPerms(false);
        return;
      }
      await screenRecorder.stopRecording();
      await appStorage.set("micPerms", true);
      setMicPerms(true);
    }
  };

  return (
    <div className="permissions-container">
      <div className="permission-item">
        <label htmlFor="mic-permission" className="permission-label">
          Enable Mic Permissions
        </label>
        <label className="switch">
          <input
            type="checkbox"
            id="mic-permission"
            checked={micPerms}
            onChange={checkMicPermission}
          />
          <span className="slider round"></span>
        </label>
      </div>
      <div className="permission-item">
        <label htmlFor="camera-permission" className="permission-label">
          Enable Camera Permissions
        </label>
        <label className="switch">
          <input
            type="checkbox"
            id="camera-permission"
            checked={cameraPerms}
            onChange={checkCameraPermission}
          />
          <span className="slider round"></span>
        </label>
      </div>
    </div>
  );
};
