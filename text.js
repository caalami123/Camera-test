// text.js
// JavaScript for camera feed, switching camera and taking snapshots.

// DOM elements
const video = document.getElementById('cameraFeed');
const videoSelect = document.getElementById('videoSource');
const switchBtn = document.getElementById('switchBtn');
const captureBtn = document.getElementById('captureBtn');
const downloadLink = document.getElementById('downloadLink');
const canvas = document.getElementById('snapshotCanvas');

let currentStream = null;
let currentDeviceId = null;

// Helper: stop all tracks of a stream
function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
}

// Start stream with given deviceId (or default if null)
async function startStream(deviceId = null) {
  try {
    // Stop existing stream
    stopStream(currentStream);

    const constraints = {
      audio: false,
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;

    // remember current device id if available
    const videoTrack = stream.getVideoTracks()[0];
    currentDeviceId = videoTrack ? videoTrack.getSettings().deviceId || null : null;

    // refresh device list (so selected device stays current)
    await populateVideoDevices();

  } catch (err) {
    console.error('Camera error:', err);
    alert('Khalad ayaa dhacay: ' + (err.message || err.name));
  }
}

// Populate camera devices into <select>
async function populateVideoDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    // save current selection
    const prev = videoSelect.value;

    videoSelect.innerHTML = '';
    videoDevices.forEach((device, idx) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Camera ${idx + 1}`;
      videoSelect.appendChild(option);
    });

    // If we have a known currentDeviceId, select it
    if (currentDeviceId) {
      videoSelect.value = currentDeviceId;
    } else if (prev) {
      // try restore previous if exists
      videoSelect.value = prev;
    }

  } catch (err) {
    console.error('enumerateDevices error:', err);
  }
}

// Switch camera to the selected device in the <select>
async function switchCameraToSelected() {
  const selectedId = videoSelect.value;
  if (!selectedId) {
    // If no device id (some browsers), toggle facingMode fallback
    await startStream();
    return;
  }
  await startStream(selectedId);
}

// Toggle between available cameras (simple rotate)
async function rotateCamera() {
  try {
    const options = Array.from(videoSelect.options).map(o => o.value);
    if (options.length <= 1) return; // nothing to switch

    const currentIndex = options.indexOf(currentDeviceId);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextDeviceId = options[nextIndex];
    videoSelect.value = nextDeviceId;
    await startStream(nextDeviceId);
  } catch (err) {
    console.error('rotateCamera error:', err);
  }
}

// Capture snapshot from video and create download link
function captureSnapshot() {
  if (!currentStream) {
    alert('Camera ma furmin');
    return;
  }

  const videoTrack = currentStream.getVideoTracks()[0];
  const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
  const width = settings.width || video.videoWidth || 1280;
  const height = settings.height || video.videoHeight || 720;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // draw current frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // convert to blob and create download link
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = `snapshot_${Date.now()}.png`;
    downloadLink.style.display = 'inline';
    downloadLink.textContent = 'Download snapshot';
    // optionally auto-click to start download:
    // downloadLink.click();
  }, 'image/png');
}

// Init: ask for permission and populate devices
async function init() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Browser-kaagu ma taageero camera API (getUserMedia). Isticmaal browser casri ah.');
    return;
  }

  try {
    // Prompt permission by starting default stream
    await startStream();

    // populate device list after permission granted (labels available only then)
    await populateVideoDevices();

    // If there is at least one device and no selection, select first
    if (videoSelect.options.length && !videoSelect.value) {
      videoSelect.selectedIndex = 0;
    }
  } catch (err) {
    console.error('init error:', err);
  }
}

// Event listeners
videoSelect.addEventListener('change', async () => {
  await switchCameraToSelected();
});

switchBtn.addEventListener('click', async () => {
  await rotateCamera();
});

captureBtn.addEventListener('click', captureSnapshot);

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  stopStream(currentStream);
});

// Start everything
init();
