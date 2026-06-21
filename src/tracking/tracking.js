// ============================================================
// NEKOCAM – src/tracking/tracking.js
// MediaPipe face mesh – detection, landmarks, and results
// ============================================================

// ---- State ----
let faceMesh = null;
let isTracking = false;
let lastResults = null;
let onResultsCallbacks = [];
let videoElement = null;

// ---- Default config ----
const CONFIG = {
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
};

// ---- Init tracking ----
export async function initTracking(videoEl) {
    videoElement = videoEl || document.getElementById('video');
    
    try {
        // Dynamically load MediaPipe CDN
        await loadMediaPipe();
        
        // Create FaceMesh instance
        faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions(CONFIG);

        faceMesh.onResults((results) => {
            lastResults = results;
            onResultsCallbacks.forEach(cb => cb(results));
        });

        // Start detection loop
        await startDetection();
        isTracking = true;
        console.log('[Tracking] Face mesh initialized');
        return true;
    } catch (error) {
        console.error('[Tracking] Failed to initialize:', error);
        return false;
    }
}

// ---- Load MediaPipe scripts ----
function loadMediaPipe() {
    return new Promise((resolve, reject) => {
        if (typeof FaceMesh !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
        script.onload = () => {
            // Also load camera_utils for frame handling
            const camScript = document.createElement('script');
            camScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
            camScript.onload = resolve;
            camScript.onerror = reject;
            document.head.appendChild(camScript);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ---- Start detection loop ----
async function startDetection() {
    if (!faceMesh || !videoElement) return;

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            if (faceMesh && videoElement) {
                try {
                    await faceMesh.send({ image: videoElement });
                } catch (e) {
                    // Silently handle frame drop
                }
            }
        },
        width: 1280,
        height: 720,
    });

    await camera.start();
    console.log('[Tracking] Detection loop started');
}

// ---- Register results callback ----
export function onResults(callback) {
    if (typeof callback === 'function') {
        onResultsCallbacks.push(callback);
        // Return unsubscribe function
        return () => {
            const index = onResultsCallbacks.indexOf(callback);
            if (index !== -1) {
                onResultsCallbacks.splice(index, 1);
            }
        };
    }
}

// ---- Get latest results ----
export function getLatestResults() {
    return lastResults;
}

// ---- Get face landmarks (468 points) ----
export function getLandmarks() {
    if (!lastResults || !lastResults.multiFaceLandmarks || lastResults.multiFaceLandmarks.length === 0) {
        return null;
    }
    return lastResults.multiFaceLandmarks[0];
}

// ---- Get specific landmark by index ----
export function getLandmark(index) {
    const landmarks = getLandmarks();
    if (!landmarks || index < 0 || index >= landmarks.length) return null;
    return landmarks[index];
}

// ---- Check if face is detected ----
export function isFaceDetected() {
    return !!lastResults && !!lastResults.multiFaceLandmarks && lastResults.multiFaceLandmarks.length > 0;
}

// ---- Get bounding box of face ----
export function getFaceBoundingBox() {
    const landmarks = getLandmarks();
    if (!landmarks) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const lm of landmarks) {
        if (lm.x < minX) minX = lm.x;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.y > maxY) maxY = lm.y;
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

// ---- Get nose tip ----
export function getNoseTip() {
    return getLandmark(1); // MediaPipe index 1 is nose tip
}

// ---- Get left eye center ----
export function getLeftEyeCenter() {
    const indices = [33, 133, 157, 158, 159, 160, 161, 173];
    return getAverageLandmark(indices);
}

// ---- Get right eye center ----
export function getRightEyeCenter() {
    const indices = [362, 382, 381, 380, 374, 373, 390, 249, 263];
    return getAverageLandmark(indices);
}

// ---- Get mouth center ----
export function getMouthCenter() {
    const indices = [13, 14, 78, 308];
    return getAverageLandmark(indices);
}

// ---- Helper: average multiple landmarks ----
function getAverageLandmark(indices) {
    const landmarks = getLandmarks();
    if (!landmarks) return null;

    let sumX = 0, sumY = 0, sumZ = 0;
    let count = 0;

    for (const idx of indices) {
        if (idx < landmarks.length) {
            sumX += landmarks[idx].x;
            sumY += landmarks[idx].y;
            sumZ += landmarks[idx].z;
            count++;
        }
    }

    if (count === 0) return null;
    return {
        x: sumX / count,
        y: sumY / count,
        z: sumZ / count,
    };
}

// ---- Stop tracking ----
export function stopTracking() {
    isTracking = false;
    faceMesh = null;
    lastResults = null;
    onResultsCallbacks = [];
    console.log('[Tracking] Stopped');
}

// ---- Check if tracking is active ----
export function isTrackingActive() {
    return isTracking;
}

// ---- Toggle tracking on/off ----
export function toggleTracking() {
    if (isTracking) {
        stopTracking();
        return false;
    } else {
        initTracking(videoElement);
        return true;
    }
}
