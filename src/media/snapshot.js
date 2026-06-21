// ============================================================
// NEKOCAM – src/media/snapshot.js
// Snapshot capture – PNG export with full resolution
// ============================================================

// ---- State ----
let lastSnapshot = null;

// ---- Take snapshot ----
export function takeSnapshot(canvasElement, options = {}) {
    const {
        format = 'image/png',
        quality = 0.92,
        scale = 1.0,
    } = options;

    if (!canvasElement) {
        console.error('[Snapshot] No canvas provided');
        return null;
    }

    // Create temporary canvas for scaling if needed
    let sourceCanvas = canvasElement;
    let targetCanvas = null;

    if (scale !== 1.0) {
        targetCanvas = document.createElement('canvas');
        targetCanvas.width = canvasElement.width * scale;
        targetCanvas.height = canvasElement.height * scale;
        const ctx = targetCanvas.getContext('2d');
        ctx.drawImage(canvasElement, 0, 0, targetCanvas.width, targetCanvas.height);
        sourceCanvas = targetCanvas;
    }

    // Capture
    const dataURL = sourceCanvas.toDataURL(format, quality);
    lastSnapshot = dataURL;

    // Clean up temporary canvas
    if (targetCanvas) {
        targetCanvas.width = 0;
        targetCanvas.height = 0;
    }

    console.log('[Snapshot] Captured');
    return dataURL;
}

// ---- Download snapshot ----
export function downloadSnapshot(canvasElement, filename = 'neko-cam-snapshot.png', options = {}) {
    const dataURL = takeSnapshot(canvasElement, options);
    if (!dataURL) return false;

    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    console.log('[Snapshot] Downloaded:', filename);
    return true;
}

// ---- Get last snapshot as dataURL ----
export function getLastSnapshot() {
    return lastSnapshot;
}

// ---- Get last snapshot as Blob ----
export function getSnapshotBlob(canvasElement, options = {}) {
    const dataURL = takeSnapshot(canvasElement, options);
    if (!dataURL) return null;

    // Convert dataURL to Blob
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
}

// ---- Save snapshot to device (using File System API if available) ----
export async function saveSnapshot(canvasElement, filename = 'neko-cam-snapshot.png') {
    try {
        const blob = getSnapshotBlob(canvasElement);
        if (!blob) {
            console.error('[Snapshot] Failed to create blob');
            return false;
        }

        // Try using File System Access API first
        if ('showSaveFilePicker' in window) {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'PNG Image',
                    accept: { 'image/png': ['.png'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            console.log('[Snapshot] Saved with File System API');
            return true;
        }

        // Fallback: download
        return downloadSnapshot(canvasElement, filename);
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('[Snapshot] Save failed:', error);
        }
        return false;
    }
}

// ---- Clear last snapshot ----
export function clearSnapshot() {
    lastSnapshot = null;
}

// ---- Check if snapshot exists ----
export function hasSnapshot() {
    return !!lastSnapshot;
}
