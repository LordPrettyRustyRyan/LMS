import { useEffect, useRef, useState } from "react";
import { uploadMedia } from "../../api/media";

const Blending = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // ---------------------------------------------------
    // STATES
    // ---------------------------------------------------

    const [recording, setRecording] = useState(false);

    const [audioURL, setAudioURL] = useState(null);

    const [uploading, setUploading] = useState(false);

    const [playingId, setPlayingId] = useState(null);

    const mediaRecorderRef = useRef(null);

    const chunksRef = useRef([]);

    const audioRefs = useRef({});

    // ---------------------------------------------------
    // LOAD SAVED RESPONSE
    // ---------------------------------------------------

    useEffect(() => {
        if (response?.audio_url) {
            setAudioURL(response.audio_url);
        }
    }, [response]);

    // ---------------------------------------------------
    // PLAY LETTER AUDIO
    // ---------------------------------------------------

    const playAudio = async (id, src) => {
        try {
            // stop previous
            Object.values(audioRefs.current).forEach((audio) => {
                audio.pause();
                audio.currentTime = 0;
            });

            const audio = new Audio(src);

            audioRefs.current[id] = audio;

            setPlayingId(id);

            audio.onended = () => {
                setPlayingId(null);
            };

            await audio.play();

        } catch (err) {
            console.error(err);
            alert("Failed to play audio");
        }
    };

    // ---------------------------------------------------
    // RECORDING
    // ---------------------------------------------------

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

            mediaRecorder.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                try {
                    const blob = new Blob(
                        chunksRef.current,
                        {
                            type: "audio/webm",
                        }
                    );

                    // -------------------------------------
                    // LOCAL PREVIEW
                    // -------------------------------------

                    const localUrl =
                        URL.createObjectURL(blob);

                    setAudioURL(localUrl);

                    setUploading(true);

                    // -------------------------------------
                    // CLOUDINARY UPLOAD
                    // -------------------------------------

                    const file = new File(
                        [blob],
                        `blending-answer-${subQuestion.id}.webm`,
                        {
                            type: "audio/webm",
                        }
                    );

                    const uploadRes =
                        await uploadMedia(
                            file,
                            "assignment-audio"
                        );

                    const cloudUrl =
                        uploadRes?.data?.url;

                    // -------------------------------------
                    // SAVE FINAL URL
                    // -------------------------------------

                    setAudioURL(cloudUrl);

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

    // ---------------------------------------------------
    // RETRY
    // ---------------------------------------------------

    const retryAnswer = () => {
        if (isLocked) return;

        setAudioURL(null);
    };

    // ---------------------------------------------------
    // GET LETTER LABEL
    // ---------------------------------------------------

    const getLetterLabel = (audioUrl) => {
        if (!audioUrl) return "?";

        try {
            const filename =
                audioUrl.split("/").pop();

            // c_jklbxm.mp3 → c
            return filename.split("_")[0]
                ?.toUpperCase();
        } catch {
            return "?";
        }
    };

    // ---------------------------------------------------
    // RENDER CONTENT
    // ---------------------------------------------------

    const renderContent = () => {
        return subQuestion?.content?.map((c, i) => {
            // -----------------------------------------
            // AUDIO LETTER BUTTON
            // -----------------------------------------

            if (c.type === "audio") {
                const isPlaying =
                    playingId === c.id;

                return (
                    <button
                        key={c.id}
                        onClick={() =>
                            playAudio(c.id, c.value)
                        }
                        className={`
                            flex h-24 w-24 items-center justify-center
                            rounded-3xl border-2 text-3xl font-bold
                            transition-all duration-200
                            ${
                                isPlaying
                                    ? "border-indigo-600 bg-indigo-600 text-white scale-105"
                                    : "border-zinc-300 bg-white text-zinc-800 hover:border-indigo-400 hover:bg-indigo-50"
                            }
                        `}
                    >
                        {getLetterLabel(c.value)}
                    </button>
                );
            }

            // -----------------------------------------
            // SYMBOL
            // -----------------------------------------

            if (c.type === "symbol") {
                return (
                    <div
                        key={i}
                        className="text-5xl font-bold text-zinc-500"
                    >
                        {c.value}
                    </div>
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

            {/* ------------------------------------------------ */}
            {/* LETTER BLOCKS */}
            {/* ------------------------------------------------ */}

            <div
                className="
                    mb-10 mt-10 flex flex-wrap items-center
                    justify-center gap-5
                "
            >
                {renderContent()}
            </div>

            {/* ------------------------------------------------ */}
            {/* RECORD CONTROLS */}
            {/* ------------------------------------------------ */}

            <div className="flex flex-wrap items-center justify-center gap-4">
                {!recording ? (
                    audioURL ? (
                        <button
                            onClick={retryAnswer}
                            disabled={isLocked}
                            className="
                                rounded-2xl bg-orange-500
                                px-6 py-4 text-lg font-semibold
                                text-white transition
                                hover:bg-orange-600
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            🔁 Retry Answer
                        </button>
                    ) : (
                        <button
                            onClick={startRecording}
                            disabled={isLocked}
                            className="
                                rounded-2xl bg-indigo-600
                                px-6 py-4 text-lg font-semibold
                                text-white transition
                                hover:bg-indigo-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            🎤 Record Answer
                        </button>
                    )
                ) : (
                    <button
                        onClick={stopRecording}
                        className="
                            rounded-2xl bg-red-600
                            px-6 py-4 text-lg font-semibold
                            text-white transition
                            hover:bg-red-700
                        "
                    >
                        ⏹ Stop Recording
                    </button>
                )}

                {uploading && (
                    <div className="text-sm font-medium text-zinc-500">
                        Uploading audio...
                    </div>
                )}
            </div>

            {/* ------------------------------------------------ */}
            {/* AUDIO PREVIEW */}
            {/* ------------------------------------------------ */}

            {audioURL && (
                <div className="mt-8">
                    <div className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-zinc-500">
                        Your Answer
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

export default Blending;