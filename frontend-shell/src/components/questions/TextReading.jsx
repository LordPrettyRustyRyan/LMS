import { useEffect, useRef, useState } from "react";
import {
    Mic,
    Square,
    RotateCcw,
    Loader2,
    Play,
} from "lucide-react";

import { uploadMedia } from "../../api/media";

const TextReading = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // ---------------------------------------------------
    // STATES
    // ---------------------------------------------------

    const [recording, setRecording] =
        useState(false);

    const [audioURL, setAudioURL] =
        useState(null);

    const [uploading, setUploading] =
        useState(false);

    // ---------------------------------------------------
    // REFS
    // ---------------------------------------------------

    const mediaRecorderRef = useRef(null);

    const streamRef = useRef(null);

    const chunksRef = useRef([]);

    // ---------------------------------------------------
    // CONTENT
    // ---------------------------------------------------

    const fullText = subQuestion?.content
        ?.map((c) => c.value)
        .join(" ");

    // ---------------------------------------------------
    // LOAD SAVED RESPONSE
    // ---------------------------------------------------

    useEffect(() => {
        if (response?.audio_url) {
            setAudioURL(response.audio_url);
        }
    }, [response]);

    // ---------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------

    useEffect(() => {
        return () => {
            stopTracks();
        };
    }, []);

    const stopTracks = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) =>
                    track.stop()
                );

            streamRef.current = null;
        }
    };

    // ---------------------------------------------------
    // START RECORDING
    // ---------------------------------------------------

    const startRecording = async () => {
        if (isLocked || uploading) return;

        try {
            // reset old preview
            setAudioURL(null);

            // -----------------------------------------
            // GET MIC
            // -----------------------------------------

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                    }
                );

            streamRef.current = stream;

            // -----------------------------------------
            // RECORDER
            // -----------------------------------------

            const mediaRecorder =
                new MediaRecorder(stream, {
                    mimeType: "audio/webm",
                });

            mediaRecorderRef.current =
                mediaRecorder;

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (
                event
            ) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(
                        event.data
                    );
                }
            };

            mediaRecorder.onstop = async () => {
                try {
                    // ---------------------------------
                    // BLOB
                    // ---------------------------------

                    const blob = new Blob(
                        chunksRef.current,
                        {
                            type: "audio/webm",
                        }
                    );

                    // ---------------------------------
                    // INSTANT LOCAL PREVIEW
                    // FAST UI FEEDBACK
                    // ---------------------------------

                    const localURL =
                        URL.createObjectURL(blob);

                    setAudioURL(localURL);

                    // ---------------------------------
                    // UPLOAD
                    // ---------------------------------

                    setUploading(true);

                    const file = new File(
                        [blob],
                        `text-reading-${subQuestion.id}-${Date.now()}.webm`,
                        {
                            type: "audio/webm",
                        }
                    );

                    const uploadRes =
                        await uploadMedia(
                            file,
                            "assignment-reading"
                        );

                    const cloudURL =
                        uploadRes?.data?.url;

                    if (!cloudURL) {
                        throw new Error(
                            "Upload failed"
                        );
                    }

                    // ---------------------------------
                    // SAVE FINAL CLOUD URL
                    // ---------------------------------

                    setAudioURL(cloudURL);

                    await onAnswer({
                        audio_url: cloudURL,
                    });

                } catch (err) {
                    console.error(err);

                    alert(
                        "Failed to upload recording"
                    );
                } finally {
                    setUploading(false);

                    stopTracks();
                }
            };

            // -----------------------------------------
            // START
            // -----------------------------------------

            mediaRecorder.start(250);

            setRecording(true);

        } catch (err) {
            console.error(err);

            alert(
                "Microphone permission denied"
            );
        }
    };

    // ---------------------------------------------------
    // STOP RECORDING
    // ---------------------------------------------------

    const stopRecording = () => {
        try {
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state !==
                    "inactive"
            ) {
                mediaRecorderRef.current.stop();
            }

            setRecording(false);

        } catch (err) {
            console.error(err);

            setRecording(false);

            stopTracks();
        }
    };

    // ---------------------------------------------------
    // RETRY
    // ---------------------------------------------------

    const retryRecording = () => {
        if (isLocked || uploading) return;

        setAudioURL(null);

        startRecording();
    };

    // ---------------------------------------------------
    // UI
    // ---------------------------------------------------

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ========================================== */}
            {/* TEXT */}
            {/* ========================================== */}

            <div
                className="
                    mb-10 text-center text-3xl
                    font-semibold leading-17.5
                    text-zinc-800
                "
            >
                {fullText}
            </div>

            {/* ========================================== */}
            {/* CONTROLS */}
            {/* ========================================== */}

            <div className="flex flex-wrap items-center justify-center gap-4">
                {!recording ? (
                    audioURL ? (
                        <button
                            onClick={
                                retryRecording
                            }
                            disabled={
                                isLocked ||
                                uploading
                            }
                            className="
                                flex items-center gap-3
                                rounded-2xl bg-orange-500
                                px-6 py-4 text-lg
                                font-semibold text-white
                                transition hover:bg-orange-600
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            <RotateCcw
                                size={22}
                            />

                            Record Again
                        </button>
                    ) : (
                        <button
                            onClick={
                                startRecording
                            }
                            disabled={
                                isLocked ||
                                uploading
                            }
                            className="
                                flex items-center gap-3
                                rounded-2xl bg-indigo-600
                                px-6 py-4 text-lg
                                font-semibold text-white
                                transition hover:bg-indigo-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            <Mic size={22} />

                            Start Reading
                        </button>
                    )
                ) : (
                    <button
                        onClick={stopRecording}
                        className="
                            flex items-center gap-3
                            rounded-2xl bg-red-600
                            px-6 py-4 text-lg
                            font-semibold text-white
                            transition hover:bg-red-700
                        "
                    >
                        <Square size={20} />

                        Stop Recording
                    </button>
                )}

                {uploading && (
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                        <Loader2
                            size={18}
                            className="animate-spin"
                        />

                        Uploading recording...
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* AUDIO PREVIEW */}
            {/* ========================================== */}

            {audioURL && (
                <div
                    className="
                        mt-8 rounded-2xl border
                        border-zinc-200 bg-zinc-50 p-5
                    "
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Play
                            size={18}
                            className="text-indigo-600"
                        />

                        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                            Audio Preview
                        </p>
                    </div>

                    <audio
                        controls
                        src={audioURL}
                        className="w-full"
                    />
                </div>
            )}
        </div>
    );
};

export default TextReading;
