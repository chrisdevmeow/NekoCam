// ============================================================
// NEKOCAM – src/core/camera.js
// Camera handling – getUserMedia, resolution, stream management
// ============================================================

// ---- Init ----
export async function initCamera(videoElement) {
    console.log('[Camera] Requesting camera...');

    const constraints = {
        video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user',
            frameRate: { ideal: 30 },
        },
        audio: false,
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        await videoElement.play();
        console.log('[Camera] Camera started successfully');
        console.log('[Camera] Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
        return stream;
    } catch (error) {
        console.error('[Camera] Failed to get camera:', error);
        throw error;
    }
}

// ---- Stop camera ----
export function stopCamera(videoElement) {
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
}
