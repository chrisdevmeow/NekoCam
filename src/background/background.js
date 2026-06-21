// ============================================================
// NEKOCAM – src/background/background.js
// Background handling – green screen, replacement, color spill
// ============================================================

import { getGL } from '../core/webgl-renderer.js';

// ---- State ----
let backgroundImage = null;
let backgroundVideo = null;
let backgroundColor = [0.0, 0.0, 0.0]; // black by default
let isGreenScreenActive = false;
let isBackgroundReplaceActive = false;
let greenScreenKey = [0.0, 1.0, 0.0]; // pure green
let colorSpillAmount = 0.0;
let backgroundTexture = null;

// ---- Set solid color background ----
export function setBackgroundColor(r, g, b) {
    backgroundColor = [r / 255.0, g / 255.0, b / 255.0];
    updateBackgroundTexture();
    console.log('[Background] Color set to:', backgroundColor);
}

// ---- Load image background ----
export function loadBackgroundImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            backgroundImage = img;
            updateBackgroundTexture();
            resolve(img);
        };
        img.onerror = reject;
        img.src = url;
    });
}

// ---- Load video background ----
export function loadBackgroundVideo(url) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.onloadeddata = () => {
            backgroundVideo = video;
            video.play();
            updateBackgroundTexture();
            resolve(video);
        };
        video.onerror = reject;
        video.src = url;
    });
}

// ---- Update background texture in WebGL ----
function updateBackgroundTexture() {
    const gl = getGL();
    if (!gl) return;

    // Create or reuse texture
    if (!backgroundTexture) {
        backgroundTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);

    // Determine source
    let source = null;
    if (backgroundVideo && backgroundVideo.readyState >= 2) {
        source = backgroundVideo;
    } else if (backgroundImage && backgroundImage.complete) {
        source = backgroundImage;
    } else {
        // Use solid color
        const pixels = new Uint8Array([
            backgroundColor[0] * 255,
            backgroundColor[1] * 255,
            backgroundColor[2] * 255,
            255
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return;
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

// ---- Enable/disable green screen ----
export function enableGreenScreen(keyR, keyG, keyB) {
    if (keyR !== undefined && keyG !== undefined && keyB !== undefined) {
        greenScreenKey = [keyR / 255.0, keyG / 255.0, keyB / 255.0];
    }
    isGreenScreenActive = true;
    console.log('[Background] Green screen enabled with key:', greenScreenKey);
}

// ---- Disable green screen ----
export function disableGreenScreen() {
    isGreenScreenActive = false;
    console.log('[Background] Green screen disabled');
}

// ---- Toggle green screen ----
export function toggleGreenScreen() {
    if (isGreenScreenActive) {
        disableGreenScreen();
    } else {
        enableGreenScreen();
    }
    return isGreenScreenActive;
}

// ---- Set color spill amount ----
export function setColorSpill(amount) {
    colorSpillAmount = Math.max(0, Math.min(1, amount));
    console.log('[Background] Color spill set to:', colorSpillAmount);
}

// ---- Enable background replacement (using current background) ----
export function enableBackgroundReplacement() {
    if (!backgroundImage && !backgroundVideo) {
        console.warn('[Background] No background image or video loaded');
        return false;
    }
    isBackgroundReplaceActive = true;
    console.log('[Background] Replacement enabled');
    return true;
}

// ---- Disable background replacement ----
export function disableBackgroundReplacement() {
    isBackgroundReplaceActive = false;
    console.log('[Background] Replacement disabled');
}

// ---- Toggle background replacement ----
export function toggleBackgroundReplacement() {
    if (isBackgroundReplaceActive) {
        disableBackgroundReplacement();
    } else {
        enableBackgroundReplacement();
    }
    return isBackgroundReplaceActive;
}

// ---- Get current background texture ----
export function getBackgroundTexture() {
    // Update texture before returning
    updateBackgroundTexture();
    return backgroundTexture;
}

// ---- Check if background is ready ----
export function isBackgroundReady() {
    return !!(backgroundImage || backgroundVideo || backgroundColor);
}

// ---- Reset to default (black) ----
export function resetBackground() {
    backgroundImage = null;
    backgroundVideo = null;
    backgroundColor = [0.0, 0.0, 0.0];
    isGreenScreenActive = false;
    isBackgroundReplaceActive = false;
    colorSpillAmount = 0.0;
    updateBackgroundTexture();
    console.log('[Background] Reset to default');
}

// ---- Cleanup ----
export function destroyBackground() {
    const gl = getGL();
    if (gl && backgroundTexture) {
        gl.deleteTexture(backgroundTexture);
        backgroundTexture = null;
    }
    if (backgroundVideo) {
        backgroundVideo.pause();
        backgroundVideo.src = '';
        backgroundVideo = null;
    }
    backgroundImage = null;
    console.log('[Background] Destroyed');
}
