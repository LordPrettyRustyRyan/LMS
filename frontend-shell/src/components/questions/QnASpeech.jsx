import { useEffect, useRef, useState } from "react";
import { uploadMedia } from "../../api/media";

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
    // RENDER CONTENT
    // =====================================================

    const renderContent = () => {
        return subQuestion?.content?.map(
            (c, i) => {
                // -----------------------------------------
                // TEXT
                // -----------------------------------------

                if (c.type === "text") {
                    return (
                        <span
                            key={i}
                            className="mr-2"
                        >
                            {c.value}
                        </span>
                    );
                }

                // -----------------------------------------
                // IMAGE
                // -----------------------------------------

                if (c.type === "image") {
                    return (
                        <img
                            key={i}
                            src={c.value}
                            alt=""
                            className="inline-block h-24 w-24 rounded-xl object-cover"
                        />
                    );
                }

                // -----------------------------------------
                // BLANK
                // -----------------------------------------

                if (c.type === "blank") {
                    return (
                        <span
                            key={i}
                            className="mx-2 inline-block min-w-[80px] border-b-4 border-zinc-400"
                        />
                    );
                }

                return null;
            }
        );
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ================================================= */}
            {/* QUESTION */}
            {/* ================================================= */}

            <div className="mb-8 text-xl leading-10 text-zinc-800">
                {renderContent()}
            </div>

            {/* ================================================= */}
            {/* CONTROLS */}
            {/* ================================================= */}

            <div className="flex flex-wrap items-center gap-4">
                {/* RECORD */}
                {!recording ? (
                    audioUrl ? (
                        <button
                            disabled={isLocked}
                            onClick={startRecording}
                            className="rounded-2xl bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            🔁 Retry Recording
                        </button>
                    ) : (
                        <button
                            disabled={isLocked}
                            onClick={startRecording}
                            className="rounded-2xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            🎤 Start Recording
                        </button>
                    )
                ) : (
                    <button
                        onClick={stopRecording}
                        className="rounded-2xl bg-red-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-red-700"
                    >
                        ⏹ Stop Recording
                    </button>
                )}

                {/* CLEAR */}
                {audioUrl && !recording && (
                    <button
                        disabled={isLocked}
                        onClick={handleRetry}
                        className="rounded-2xl border border-zinc-300 bg-white px-6 py-4 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ❌ Clear
                    </button>
                )}

                {/* UPLOADING */}
                {uploading && (
                    <span className="text-sm font-medium text-zinc-500">
                        Uploading audio...
                    </span>
                )}
            </div>

            {/* ================================================= */}
            {/* AUDIO PREVIEW */}
            {/* ================================================= */}

            {audioUrl && (
                <div className="mt-6">
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