// ============================================================
// NEKOCAM – src/media/recorder.js
// Video/audio recording using MediaRecorder API
// ============================================================

// ---- State ----
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let stream = null;
let onStopCallbacks = [];

// ---- Init recorder ----
export function initRecorder(canvasElement, audioStream) {
    if (isRecording) {
        console.warn('[Recorder] Already recording');
        return null;
    }

    // Get canvas stream
    const canvasStream = canvasElement.captureStream(30);
    
    // Combine with audio if provided
    if (audioStream) {
        const audioTracks = audioStream.getAudioTracks();
        audioTracks.forEach(track => canvasStream.addTrack(track));
    }

    stream = canvasStream;
    recordedChunks = [];

    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 5000000, // 5 Mbps
        audioBitsPerSecond: 128000,
    });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, {
            type: 'video/webm'
        });
        const url = URL.createObjectURL(blob);
        onStopCallbacks.forEach(cb => cb(url, blob));
        recordedChunks = [];
        isRecording = false;
    };

    return mediaRecorder;
}

// ---- Start recording ----
export function startRecording(canvasElement, audioStream) {
    if (isRecording) {
        console.warn('[Recorder] Already recording');
        return false;
    }

    if (!mediaRecorder) {
        initRecorder(canvasElement, audioStream);
    }

    if (mediaRecorder && mediaRecorder.state === 'inactive') {
        mediaRecorder.start(1000); // Capture in 1-second chunks
        isRecording = true;
        console.log('[Recorder] Started');
        return true;
    }

    return false;
}

// ---- Stop recording ----
export function stopRecording() {
    if (!isRecording || !mediaRecorder) {
        console.warn('[Recorder] Not recording');
        return false;
    }

    if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        console.log('[Recorder] Stopped');
        return true;
    }

    return false;
}

// ---- Toggle recording ----
export function toggleRecording(canvasElement, audioStream) {
    if (isRecording) {
        return stopRecording();
    } else {
        return startRecording(canvasElement, audioStream);
    }
}

// ---- Get recording status ----
export function isRecordingActive() {
    return isRecording;
}

// ---- Download recorded video ----
export function downloadRecording(filename = 'neko-cam-recording.webm') {
    if (recordedChunks.length === 0) {
        console.warn('[Recorder] No recording to download');
        return false;
    }

    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    console.log('[Recorder] Downloaded:', filename);
    return true;
}

// ---- Get recorded blob ----
export function getRecordingBlob() {
    if (recordedChunks.length === 0) return null;
    return new Blob(recordedChunks, {
        type: 'video/webm'
    });
}

// ---- Get recording URL ----
export function getRecordingURL() {
    const blob = getRecordingBlob();
    if (!blob) return null;
    return URL.createObjectURL(blob);
}

// ---- Register callback for recording stop ----
export function onRecordingStop(callback) {
    if (typeof callback === 'function') {
        onStopCallbacks.push(callback);
        return () => {
            const index = onStopCallbacks.indexOf(callback);
            if (index !== -1) {
                onStopCallbacks.splice(index, 1);
            }
        };
    }
}

// ---- Cleanup ----
export function destroyRecorder() {
    if (isRecording) {
        stopRecording();
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    mediaRecorder = null;
    recordedChunks = [];
    onStopCallbacks = [];
    console.log('[Recorder] Destroyed');
}
