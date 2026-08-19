import { useCallback, useEffect, useRef, useState } from "react";

// Owns the webcam stream. Because this hook lives in the component that renders
// the camera, navigating away unmounts that component and the cleanup below
// stops the stream — the camera can never outlive the view that opened it.
export function useCamera({ onCapture, onError }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Keep the latest callbacks without re-running the stream effects.
  const onCaptureRef = useRef(onCapture);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCaptureRef.current = onCapture;
    onErrorRef.current = onError;
  });

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const closeCamera = useCallback(() => {
    stopStream();
    setCameraOpen(false);
  }, [stopStream]);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      console.error("Camera error:", err);
      onErrorRef.current?.(
        err && err.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser to continue."
          : "Unable to access your camera. Check that no other app is using it."
      );
    }
  }, []);

  // Attach the stream once the <video> is actually mounted, rather than racing
  // it with a fixed timeout.
  useEffect(() => {
    if (!cameraOpen) return;

    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    const playback = video.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {
        // Autoplay can be rejected while the element is still settling; the
        // muted + playsInline video recovers on its own.
      });
    }
  }, [cameraOpen]);

  useEffect(() => () => stopStream(), [stopStream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      onErrorRef.current?.("The camera is still starting up. Try again in a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    // The preview is mirrored for a natural selfie view, so mirror the capture
    // too — otherwise the photo comes out flipped from what was framed.
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onErrorRef.current?.("Couldn't capture that frame. Please try again.");
          return;
        }

        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        closeCamera();
        onCaptureRef.current?.(file);
      },
      "image/jpeg",
      0.95
    );
  }, [closeCamera]);

  return { cameraOpen, videoRef, openCamera, closeCamera, capturePhoto };
}
