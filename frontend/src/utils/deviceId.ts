/**
 * Returns a persistent anonymous device identifier stored in localStorage.
 * This prevents Carrier-Grade NAT (CGNAT) / mobile / shared IP collisions for guest users.
 */
export const getDeviceId = (): string => {
  try {
    let deviceId = localStorage.getItem("sail_device_id");
    if (!deviceId) {
      deviceId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("sail_device_id", deviceId);
    }
    return deviceId;
  } catch {
    return "anonymous-fallback";
  }
};
