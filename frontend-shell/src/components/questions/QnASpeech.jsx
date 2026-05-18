import { useEffect, useRef, useState } from "react";
import { uploadMedia } from "../../api/media";

import {
    Mic,
    Square,
    RotateCcw,
    Loader2,
} from "lucide-react";

const QnASpeech = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    const [recording, setRecording] = useState(false);

    // ✅ AUDIO STATES
    const [audioUrl, setAudioUrl] = useState(null);
    const [uploading, setUploading] = useState(false);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // =====================================================
    // LOAD SAVED RESPONSE
    // =====================================================

    useEffect(() => {
        if (response?.audio_url) {
            setAudioUrl(response.audio_url);
        }
    }, [response]);

    // =====================================================
    // RECORDING
    // =====================================================

    const startRecording = async () => {
        if (isLocked) return;

        try {
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });

            const mediaRecorder =
                new MediaRecorder(stream);

            mediaRecorderRef.current =
                mediaRecorder;

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (
                e
            ) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                try {
                    // -----------------------------------------
                    // CREATE AUDIO BLOB
                    // -----------------------------------------

                    const blob = new Blob(
                        chunksRef.current,
                        {
                            type: "audio/webm",
                        }
                    );

                    // -----------------------------------------
                    // LOCAL PREVIEW
                    // -----------------------------------------

                    const localUrl =
                        URL.createObjectURL(blob);

                    setAudioUrl(localUrl);

                    setUploading(true);

                    // -----------------------------------------
                    // CLOUDINARY UPLOAD
                    // -----------------------------------------

                    const file = new File(
                        [blob],
                        `speech-answer-${Date.now()}.webm`,
                        {
                            type: "audio/webm",
                        }
                    );

                    const uploadRes =
                        await uploadMedia(
                            file,
                            "assignment-speech"
                        );

                    const cloudUrl =
                        uploadRes?.data?.url;

                    // -----------------------------------------
                    // FINAL URL
                    // -----------------------------------------

                    setAudioUrl(cloudUrl);

                    // -----------------------------------------
                    // SAVE RESPONSE
                    // -----------------------------------------

                    await onAnswer({
                        audio_url: cloudUrl,
                        transcript: "",
                    });

                } catch (err) {
                    console.error(err);
                    alert("Upload failed");
                } finally {
                    setUploading(false);

                    stream
                        .getTracks()
                        .forEach((t) => t.stop());
                }
            };

            mediaRecorder.start();

            setRecording(true);

        } catch (err) {
            console.error(err);
            alert("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    // =====================================================
    // RETRY
    // =====================================================

    const handleRetry = () => {
        if (isLocked) return;

        setAudioUrl(null);

        onAnswer({
            audio_url: "",
            transcript: "",
        });
    };

    // =====================================================
    // SPLIT CONTENT
    // =====================================================

    const imageContent =
        subQuestion?.content?.find(
            (c) => c.type === "image"
        );

    const textContent =
        subQuestion?.content?.filter(
            (c) =>
                c.type === "text" ||
                c.type === "blank"
        ) || [];

    // =====================================================
    // RENDER TEXT
    // =====================================================

    const renderQuestionText = () => {
        return textContent.map((c, i) => {
            // -----------------------------------------
            // TEXT
            // -----------------------------------------

            if (c.type === "text") {
                return (
                    <span
                        key={i}
                        className="mr-3"
                    >
                        {c.value}
                    </span>
                );
            }

            // -----------------------------------------
            // BLANK
            // -----------------------------------------

            if (c.type === "blank") {
                return (
                    <span
                        key={i}
                        className="
                            mx-3 inline-block
                            min-w-30
                            border-b-4
                            border-zinc-400
                            align-middle
                        "
                    />
                );
            }

            return null;
        });
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">

            {/* ================================================= */}
            {/* QUESTION + IMAGE */}
            {/* ================================================= */}

            <div className="grid gap-6 lg:grid-cols-12">

                {/* QUESTION */}

                <div className="lg:col-span-9">
                    <div
                        className="
                            rounded-3xl
                            border border-zinc-200
                            bg-zinc-50
                            p-6
                            text-2xl
                            font-medium
                            leading-17.5
                            text-zinc-800
                        "
                    >
                        {renderQuestionText()}
                    </div>
                </div>

                {/* IMAGE */}

                <div className="lg:col-span-3">
                    {imageContent && (
                        <div
                            className="
                                overflow-hidden
                                rounded-3xl
                                border border-zinc-200
                                bg-white
                                shadow-sm
                            "
                        >
                            <img
                                src={imageContent.value}
                                alt=""
                                className="
                                    h-48
                                    w-full
                                    object-cover
                                "
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ================================================= */}
            {/* CONTROLS */}
            {/* ================================================= */}

            <div className="mt-8 flex flex-wrap items-center gap-4">

                {/* RECORD */}

                {!recording ? (
                    audioUrl ? (
                        <button
                            disabled={isLocked}
                            onClick={startRecording}
                            className="
                                flex items-center gap-3
                                rounded-2xl
                                bg-orange-500
                                px-6 py-4
                                text-lg font-semibold
                                text-white
                                transition
                                hover:bg-orange-600
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            <RotateCcw size={22} />
                            Retry Recording
                        </button>
                    ) : (
                        <button
                            disabled={isLocked}
                            onClick={startRecording}
                            className="
                                flex items-center gap-3
                                rounded-2xl
                                bg-indigo-600
                                px-6 py-4
                                text-lg font-semibold
                                text-white
                                transition
                                hover:bg-indigo-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            <Mic size={22} />
                            Start Recording
                        </button>
                    )
                ) : (
                    <button
                        onClick={stopRecording}
                        className="
                            flex items-center gap-3
                            rounded-2xl
                            bg-red-600
                            px-6 py-4
                            text-lg font-semibold
                            text-white
                            transition
                            hover:bg-red-700
                        "
                    >
                        <Square size={20} />
                        Stop Recording
                    </button>
                )}

                {/* UPLOADING */}

                {uploading && (
                    <div
                        className="
                            flex items-center gap-2
                            text-sm font-medium
                            text-zinc-500
                        "
                    >
                        <Loader2
                            size={16}
                            className="animate-spin"
                        />
                        Uploading audio...
                    </div>
                )}
            </div>

            {/* ================================================= */}
            {/* AUDIO PREVIEW */}
            {/* ================================================= */}

            {audioUrl && (
                <div
                    className="
                        mt-6
                        rounded-2xl
                        border border-zinc-200
                        bg-zinc-50
                        p-4
                    "
                >
                    <audio
                        controls
                        src={audioUrl}
                        className="w-full"
                    />
                </div>
            )}
        </div>
    );
};

export default QnASpeech;
