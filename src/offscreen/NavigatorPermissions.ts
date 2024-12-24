type ChromePermissionName =
  | PermissionName
  | "microphone"
  | "camera"
  | "local-fonts"
  | "clipboard-read"
  | "clipboard-write";
export class NavigatorPermissions {
  static async checkPermission(permissionName: ChromePermissionName) {
    const result = await navigator.permissions.query({
      name: permissionName as PermissionName,
    });
    return result.state;
  }
}
