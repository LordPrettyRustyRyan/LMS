import { useEffect, useRef, useState } from "react";
import { uploadMedia } from "../../api/media";

const Camera = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // ---------------------------------------------------
    // REFS
    // ---------------------------------------------------

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // ---------------------------------------------------
    // STATES
    // ---------------------------------------------------

    const [stream, setStream] = useState(null);

    const [capturedImage, setCapturedImage] = useState(
        response?.image_url || null
    );

    const [uploading, setUploading] = useState(false);

    const [countdown, setCountdown] = useState(null);

    const timerRef = useRef(null);

    // ---------------------------------------------------
    // INIT CAMERA
    // ---------------------------------------------------

    useEffect(() => {
        initCamera();

        return () => {
            stopCamera();
        };
    }, []);

    const initCamera = async () => {
        try {
            const mediaStream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                    },
                    audio: false,
                });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject =
                    mediaStream;
            }

        } catch (err) {
            console.error(err);
            alert("Camera access denied");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) =>
                track.stop()
            );
        }
    };

    // ---------------------------------------------------
    // CAPTURE IMAGE
    // ---------------------------------------------------

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) {
            return;
        }

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            // ---------------------------------------------------
            // LOCAL PREVIEW
            // ---------------------------------------------------

            const localDataUrl =
                canvas.toDataURL("image/png");

            setCapturedImage(localDataUrl);

            // ---------------------------------------------------
            // UPLOAD TO CLOUDINARY
            // ---------------------------------------------------

            setUploading(true);

            const blob = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png")
            );

            const file = new File(
                [blob],
                `camera-${subQuestion.id}.png`,
                {
                    type: "image/png",
                }
            );

            const uploadRes = await uploadMedia(
                file,
                "assignment-camera"
            );

            const cloudUrl =
                uploadRes?.data?.url;

            // ---------------------------------------------------
            // SAVE FINAL URL
            // ---------------------------------------------------

            setCapturedImage(cloudUrl);

            await onAnswer({
                image_url: cloudUrl,
            });

        } catch (err) {
            console.error(err);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    // ---------------------------------------------------
    // TIMER CAPTURE
    // ---------------------------------------------------

    const startTimerCapture = () => {
        if (isLocked) return;

        const duration =
            subQuestion?.camera_config
                ?.default_timer || 5;

        setCountdown(duration);

        let current = duration;

        timerRef.current = setInterval(() => {
            current -= 1;

            setCountdown(current);

            if (current <= 0) {
                clearInterval(timerRef.current);

                setCountdown(null);

                captureImage();
            }
        }, 1000);
    };

    // ---------------------------------------------------
    // RETRY
    // ---------------------------------------------------

    const handleRetry = () => {
        if (isLocked) return;

        setCapturedImage(null);

        setCountdown(null);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    // ---------------------------------------------------
    // RENDER CONTENT
    // ---------------------------------------------------

    const renderContent = () => {
        return subQuestion?.content?.map((c, i) => {
            if (c.type === "text") {
                return (
                    <p
                        key={i}
                        className="text-lg font-medium text-zinc-700"
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
                        className="mx-auto mb-4 max-h-64 rounded-2xl object-contain"
                    />
                );
            }

            return null;
        });
    };

    // ---------------------------------------------------
    // UI
    // ---------------------------------------------------

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ================================================= */}
            {/* QUESTION CONTENT */}
            {/* ================================================= */}

            <div className="mb-6 text-center">
                {renderContent()}
            </div>

            {/* ================================================= */}
            {/* CAMERA */}
            {/* ================================================= */}

            {!capturedImage && (
                <div className="flex flex-col items-center">
                    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-black shadow-md">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="h-[320px] w-[420px] object-cover"
                        />

                        {countdown !== null && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="text-7xl font-bold text-white">
                                    {countdown}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <button
                            onClick={captureImage}
                            disabled={
                                isLocked || uploading
                            }
                            className="rounded-2xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            📸 Capture
                        </button>

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
                                className="rounded-2xl bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                ⏱ Timer (
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

            {/* ================================================= */}
            {/* PREVIEW */}
            {/* ================================================= */}

            {capturedImage && (
                <div className="flex flex-col items-center">
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="max-h-[420px] rounded-3xl border border-zinc-200 shadow-md"
                    />

                    {uploading && (
                        <p className="mt-4 text-sm font-medium text-zinc-500">
                            Uploading image...
                        </p>
                    )}

                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <button
                            onClick={handleRetry}
                            disabled={
                                isLocked || uploading
                            }
                            className="rounded-2xl bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            🔁 Retry
                        </button>
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* HIDDEN CANVAS */}
            {/* ================================================= */}

            <canvas
                ref={canvasRef}
                className="hidden"
            />
        </div>
    );
};

export default Camera;