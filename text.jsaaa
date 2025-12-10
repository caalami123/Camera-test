const video = document.getElementById("cameraFeed");

async function openCamera(deviceId = null) {
    try {
        const constraints = {
            video: deviceId ? { deviceId: { exact: deviceId } } : true
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        video.srcObject = stream;

        video.onloadedmetadata = () => {
            video.play();
        };

        // Haddii width/height = 0 → force default size
        video.addEventListener("loadeddata", () => {
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                video.width = 640;
                video.height = 480;
            }
        });

    } catch (err) {
        console.error(err);
        alert("Camera error: " + err.message);
    }
}

openCamera();
