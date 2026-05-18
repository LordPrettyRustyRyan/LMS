import { useEffect, useRef, useState } from "react";
import {
    Camera as CameraIcon,
    RotateCcw,
    TimerReset,
} from "lucide-react";

import { uploadMedia } from "../../api/media";

const Camera = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // ===================================================
    // REFS
    // ===================================================

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);

    // ===================================================
    // STATES
    // ===================================================

    const [cameraReady, setCameraReady] =
        useState(false);

    const [capturedImage, setCapturedImage] =
        useState(response?.image_url || null);

    const [uploading, setUploading] =
        useState(false);

    const [countdown, setCountdown] =
        useState(null);

    // ===================================================
    // LOAD SAVED RESPONSE
    // ===================================================

    useEffect(() => {
        if (response?.image_url) {
            setCapturedImage(response.image_url);
        }
    }, [response]);

    // ===================================================
    // INIT CAMERA
    // ===================================================

    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

const startCamera = async () => {
    try {
        // -----------------------------------
        // CLEAN OLD STREAM FIRST
        // -----------------------------------

        stopCamera();

        // give browser time to release webcam
        await new Promise((resolve) =>
            setTimeout(resolve, 300)
        );

        // -----------------------------------
        // START NEW STREAM
        // -----------------------------------

        const mediaStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

        streamRef.current = mediaStream;

        // -----------------------------------
        // ATTACH STREAM
        // -----------------------------------

        if (videoRef.current) {
            videoRef.current.srcObject =
                mediaStream;

            // DO NOT CALL .play()
            // browser handles autoplay
        }

        setCameraReady(true);

    } catch (err) {
        console.error(err);

        setCameraReady(false);

        if (
            err.name === "NotReadableError"
        ) {
            alert(
                "Camera already in use by another app/browser tab"
            );
        } else {
            alert("Unable to access camera");
        }
    }
};

const stopCamera = () => {
    try {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) =>
                    track.stop()
                );

            streamRef.current = null;
        }

        // VERY IMPORTANT
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

    } catch (err) {
        console.error(err);
    }
};

    // ===================================================
    // CAPTURE IMAGE
    // ===================================================

    const captureImage = async () => {
        if (
            !videoRef.current ||
            !canvasRef.current
        ) {
            return;
        }

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            const width =
                video.videoWidth || 1280;

            const height =
                video.videoHeight || 720;

            canvas.width = width;
            canvas.height = height;

            const ctx =
                canvas.getContext("2d");

            ctx.drawImage(
                video,
                0,
                0,
                width,
                height
            );

            // -----------------------------------
            // LOCAL PREVIEW
            // -----------------------------------

            const localPreview =
                canvas.toDataURL(
                    "image/jpeg",
                    0.9
                );

            setCapturedImage(localPreview);

            // -----------------------------------
            // UPLOAD
            // -----------------------------------

            setUploading(true);

            const blob =
                await new Promise(
                    (resolve) => {
                        canvas.toBlob(
                            resolve,
                            "image/jpeg",
                            0.9
                        );
                    }
                );

            const file = new File(
                [blob],
                `camera-${subQuestion.id}.jpg`,
                {
                    type: "image/jpeg",
                }
            );

            const uploadRes =
                await uploadMedia(
                    file,
                    "assignment-camera"
                );

            const cloudUrl =
                uploadRes?.data?.url;

            // -----------------------------------
            // FINAL PREVIEW
            // -----------------------------------

            setCapturedImage(cloudUrl);

            await onAnswer({
                image_url: cloudUrl,
            });

        } catch (err) {
            console.error(err);

            alert(
                "Failed to upload image"
            );
        } finally {
            setUploading(false);
        }
    };

    // ===================================================
    // TIMER CAPTURE
    // ===================================================

    const startTimerCapture = () => {
        if (isLocked) return;

        const duration =
            subQuestion?.camera_config
                ?.default_timer || 5;

        setCountdown(duration);

        let current = duration;

        timerRef.current = setInterval(
            () => {
                current -= 1;

                setCountdown(current);

                if (current <= 0) {
                    clearInterval(
                        timerRef.current
                    );

                    setCountdown(null);

                    captureImage();
                }
            },
            1000
        );
    };

    // ===================================================
    // RETRY
    // ===================================================
const handleRetry = async () => {
    if (isLocked) return;

    setCapturedImage(null);
    setCountdown(null);

    if (timerRef.current) {
        clearInterval(timerRef.current);
    }

    setCameraReady(false);

    await startCamera();
};

    // ===================================================
    // CONTENT
    // ===================================================

    const renderContent = () => {
        return subQuestion?.content?.map(
            (c, i) => {
                if (c.type === "text") {
                    return (
                        <p
                            key={i}
                            className="text-2xl font-semibold leading-relaxed text-zinc-800"
                        >
                            {c.value}
                        </p>
                    );
                }

                if (c.type === "image") {
                    return (
                        <img
                            key={i}
                            src={c.value}
                            alt=""
                            className="mx-auto mb-5 max-h-72 rounded-3xl object-contain shadow-sm"
                        />
                    );
                }

                return null;
            }
        );
    };

    // ===================================================
    // UI
    // ===================================================

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ======================================== */}
            {/* QUESTION */}
            {/* ======================================== */}

            <div className="mb-8 text-center">
                {renderContent()}
            </div>

            {/* ======================================== */}
            {/* CAMERA AREA */}
            {/* ======================================== */}

            {!capturedImage && (
                <div className="flex flex-col items-center">
                    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-black shadow-xl">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="h-105 w-full max-w-3xl object-cover"
                        />

                        {/* COUNTDOWN */}
                        {countdown !== null && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="text-8xl font-bold text-white">
                                    {countdown}
                                </div>
                            </div>
                        )}

                        {/* CAMERA LOADING */}
                        {!cameraReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                                Starting camera...
                            </div>
                        )}
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        {/* CAPTURE */}
                        <button
                            onClick={captureImage}
                            disabled={
                                isLocked ||
                                uploading
                            }
                            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CameraIcon size={22} />

                            Capture
                        </button>

                        {/* TIMER */}
                        {subQuestion?.camera_config
                            ?.allow_timer && (
                            <button
                                onClick={
                                    startTimerCapture
                                }
                                disabled={
                                    isLocked ||
                                    uploading ||
                                    countdown !== null
                                }
                                className="flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <TimerReset
                                    size={22}
                                />

                                Timer (
                                {subQuestion
                                    ?.camera_config
                                    ?.default_timer ||
                                    5}
                                s)
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ======================================== */}
            {/* PREVIEW */}
            {/* ======================================== */}

            {capturedImage && (
                <div className="flex flex-col items-center">
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="max-h-125 w-full max-w-3xl rounded-3xl border border-zinc-200 object-cover shadow-xl"
                    />

                    {/* UPLOADING */}
                    {uploading && (
                        <p className="mt-4 text-sm font-medium text-zinc-500">
                            Uploading image...
                        </p>
                    )}

                    {/* RETRY */}
                    <div className="mt-6">
                        <button
                            onClick={handleRetry}
                            disabled={
                                isLocked ||
                                uploading
                            }
                            className="flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw
                                size={22}
                            />

                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* ======================================== */}
            {/* HIDDEN CANVAS */}
            {/* ======================================== */}

            <canvas
                ref={canvasRef}
                className="hidden"
            />
        </div>
    );
};

export default Camera;
