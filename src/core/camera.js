// ============================================================
// NEKOCAM – src/core/camera.js
// Camera handling – getUserMedia, resolution, stream management
// ============================================================

// ---- Default settings ----
const DEFAULT_SETTINGS = {
    resolution: { ideal: 1280, max: 1920 },
    facingMode: 'user', // 'user' (front) or 'environment' (back)
    frameRate: { ideal: 30, max: 60 },
};

// ---- State ----
let currentStream = null;
let currentSettings = { ...DEFAULT_SETTINGS };

// ---- Init ----
export async function initCamera(videoElement, customSettings = {}) {
    // Merge custom settings
    const settings = { ...currentSettings, ...customSettings };
    currentSettings = settings;

    const constraints = {
        video: {
            width: settings.resolution,
            height: settings.resolution,
            facingMode: settings.facingMode,
            frameRate: settings.frameRate,
        },
        audio: false, // We don't need audio for the effect pipeline
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        videoElement.srcObject = stream;
        await videoElement.play();
        return stream;
    } catch (error) {
        console.error('[Camera] Failed to get camera:', error);
        throw error;
    }
}

// ---- Stop camera ----
export function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

// ---- Switch facing mode ----
export async function switchFacingMode(videoElement, mode) {
    if (mode !== 'user' && mode !== 'environment') {
        throw new Error('Invalid facing mode. Use "user" or "environment".');
    }
    stopCamera();
    return await initCamera(videoElement, { facingMode: mode });
}

// ---- Get current stream ----
export function getStream() {
    return currentStream;
}

// ---- Get current settings ----
export function getCameraSettings() {
    return { ...currentSettings };
}

// ---- Check if camera is available ----
export function isCameraAvailable() {
    return !!currentStream && currentStream.active;
}

// ---- Get list of available cameras ----
export async function getCameraDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
        console.error('[Camera] Failed to enumerate devices:', error);
        return [];
    }
}

// ---- Get current resolution from video track ----
export function getCurrentResolution() {
    if (!currentStream) return null;
    const track = currentStream.getVideoTracks()[0];
    if (!track) return null;
    const settings = track.getSettings();
    return {
        width: settings.width,
        height: settings.height,
    };
}

// ---- Get current frame rate ----
export function getCurrentFrameRate() {
    if (!currentStream) return null;
    const track = currentStream.getVideoTracks()[0];
    if (!track) return null;
    const settings = track.getSettings();
    return settings.frameRate || null;
}
