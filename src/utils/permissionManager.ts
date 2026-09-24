/**
 * Z.Z KHATA - Native & Browser Permission Manager
 * Adheres strictly to the on-demand permission rule:
 * NEVER requests permissions on initial app launch.
 * Requests each permission ONLY when the user initiates that specific action.
 */

export type PermissionType = 'camera' | 'files' | 'notifications';
export type PermissionStateResult = 'granted' | 'denied' | 'prompt' | 'permanently_denied';

export interface PermissionResponse {
  type: PermissionType;
  status: PermissionStateResult;
  message?: string;
}

// Memory cache of user decisions during the session
const sessionDenials = new Set<PermissionType>();

/**
 * Check the current permission status without prompting the user
 */
export async function checkPermissionStatus(type: PermissionType): Promise<PermissionStateResult> {
  try {
    if (type === 'notifications') {
      if (!('Notification' in window)) return 'granted';
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') return 'permanently_denied';
      return 'prompt';
    }

    if (type === 'camera' && 'navigator' in window && navigator.permissions) {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (status.state === 'granted') return 'granted';
      if (status.state === 'denied') return 'permanently_denied';
      return 'prompt';
    }

    // Default to prompt if query is unsupported
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Request camera permission ON-DEMAND when user taps 📷 Camera
 */
export async function requestCameraPermission(): Promise<PermissionResponse> {
  // If permanently denied previously in browser settings
  const current = await checkPermissionStatus('camera');
  if (current === 'permanently_denied' || sessionDenials.has('camera')) {
    return {
      type: 'camera',
      status: 'permanently_denied',
      message: 'Camera permission is blocked. Please enable it in browser or app settings.',
    };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    // MediaDevices not supported, fall back gracefully to native file input
    return { type: 'camera', status: 'granted' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });

    // Permission granted! Stop video track immediately as we use native camera capture
    stream.getTracks().forEach((track) => track.stop());
    sessionDenials.delete('camera');

    return { type: 'camera', status: 'granted' };
  } catch (err: unknown) {
    const error = err as { name?: string };
    const isPermanent =
      error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';

    if (isPermanent) {
      sessionDenials.add('camera');
    }

    return {
      type: 'camera',
      status: isPermanent ? 'permanently_denied' : 'denied',
      message:
        'Camera permission was denied. Camera is needed only to snap photos of receipts and bills.',
    };
  }
}

/**
 * Request files/photos permission ON-DEMAND when user taps 📁 File / Gallery
 */
export async function requestFilePermission(): Promise<PermissionResponse> {
  // On web/Android Chrome, input[type=file] triggers system picker directly
  // We check if file input works in current context
  try {
    const input = document.createElement('input');
    input.type = 'file';
    return { type: 'files', status: 'granted' };
  } catch {
    return {
      type: 'files',
      status: 'denied',
      message: 'File access is not supported on this browser.',
    };
  }
}

/**
 * Request notification permission ON-DEMAND when user creates/activates a Reminder
 */
export async function requestNotificationPermission(): Promise<PermissionResponse> {
  if (!('Notification' in window)) {
    // Notifications not supported, graceful fallback
    return { type: 'notifications', status: 'granted' };
  }

  if (Notification.permission === 'granted') {
    return { type: 'notifications', status: 'granted' };
  }

  if (Notification.permission === 'denied') {
    return {
      type: 'notifications',
      status: 'permanently_denied',
      message: 'Notifications are blocked in your device settings.',
    };
  }

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      return { type: 'notifications', status: 'granted' };
    } else if (result === 'denied') {
      return {
        type: 'notifications',
        status: 'permanently_denied',
        message: 'Notification permission was denied. You will not receive sound alerts for reminders.',
      };
    }
    return { type: 'notifications', status: 'denied' };
  } catch {
    return { type: 'notifications', status: 'denied' };
  }
}
