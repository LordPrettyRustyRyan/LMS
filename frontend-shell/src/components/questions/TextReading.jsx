import { useEffect, useRef, useState } from "react";
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

    const [started, setStarted] = useState(false);

    const [listening, setListening] = useState(false);

    const [transcript, setTranscript] = useState("");

    const [highlightIndex, setHighlightIndex] =
        useState(-1);

    const [audioURL, setAudioURL] = useState(null);

    const [uploading, setUploading] = useState(false);

    const [accuracy, setAccuracy] = useState(0);

    const recognitionRef = useRef(null);

    const mediaRecorderRef = useRef(null);

    const chunksRef = useRef([]);

    // ---------------------------------------------------
    // CONTENT
    // ---------------------------------------------------

    const fullText = subQuestion.content
        .map((c) => c.value)
        .join(" ");

    const words = fullText.split(" ");

    // ---------------------------------------------------
    // LOAD SAVED RESPONSE
    // ---------------------------------------------------

    useEffect(() => {
        if (response?.transcript) {
            setTranscript(response.transcript);
        }

        if (response?.audio_url) {
            setAudioURL(response.audio_url);
        }

        if (response?.accuracy) {
            setAccuracy(response.accuracy);
        }
    }, [response]);

    // ---------------------------------------------------
    // CALCULATE ACCURACY
    // ---------------------------------------------------

    const calculateAccuracy = (spokenText) => {
        const spokenWords = spokenText
            .toLowerCase()
            .trim()
            .split(/\s+/);

        let correct = 0;

        words.forEach((word, index) => {
            if (
                spokenWords[index] ===
                word.toLowerCase()
            ) {
                correct++;
            }
        });

        return Math.round(
            (correct / words.length) * 100
        );
    };

    // ---------------------------------------------------
    // START READING
    // ---------------------------------------------------

    const startReading = async () => {
        if (isLocked) return;

        try {
            setStarted(true);

            setTranscript("");

            setHighlightIndex(-1);

            // -----------------------------------------
            // SPEECH RECOGNITION
            // -----------------------------------------

            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                alert(
                    "Speech Recognition not supported"
                );
                return;
            }

            const recognition =
                new SpeechRecognition();

            recognition.continuous = true;

            recognition.interimResults = true;

            recognition.lang = "en-US";

            // -----------------------------------------
            // AUDIO RECORDING
            // -----------------------------------------

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        audio: true,
                    }
                );

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
                    const blob = new Blob(
                        chunksRef.current,
                        {
                            type: "audio/webm",
                        }
                    );

                    // ---------------------------------
                    // LOCAL PREVIEW
                    // ---------------------------------

                    const localUrl =
                        URL.createObjectURL(blob);

                    setAudioURL(localUrl);

                    setUploading(true);

                    // ---------------------------------
                    // CLOUDINARY UPLOAD
                    // ---------------------------------

                    const file = new File(
                        [blob],
                        `text-reading-${subQuestion.id}.webm`,
                        {
                            type: "audio/webm",
                        }
                    );

                    const uploadRes =
                        await uploadMedia(
                            file,
                            "assignment-reading"
                        );

                    const cloudUrl =
                        uploadRes?.data?.url;

                    // ---------------------------------
                    // FINAL SAVE
                    // ---------------------------------

                    setAudioURL(cloudUrl);

                    const finalAccuracy =
                        calculateAccuracy(
                            transcript
                        );

                    setAccuracy(finalAccuracy);

                    await onAnswer({
                        transcript,
                        audio_url: cloudUrl,
                        accuracy: finalAccuracy,
                    });

                } catch (err) {
                    console.error(err);
                    alert("Upload failed");
                } finally {
                    setUploading(false);

                    stream
                        .getTracks()
                        .forEach((t) =>
                            t.stop()
                        );
                }
            };

            // -----------------------------------------
            // RECOGNITION EVENTS
            // -----------------------------------------

            recognition.onstart = () => {
                setListening(true);
            };

            recognition.onresult = (event) => {
                let text = "";

                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {
                    text +=
                        event.results[i][0]
                            .transcript + " ";
                }

                text = text.trim();

                setTranscript(text);

                const spokenWords = text
                    .toLowerCase()
                    .split(/\s+/);

                let matchIndex = -1;

                for (
                    let i = 0;
                    i < words.length;
                    i++
                ) {
                    if (
                        spokenWords[i] ===
                        words[i]?.toLowerCase()
                    ) {
                        matchIndex = i;
                    }
                }

                setHighlightIndex(matchIndex);
            };

            recognition.onend = () => {
                setListening(false);

                mediaRecorder.stop();
            };

            // -----------------------------------------
            // START BOTH
            // -----------------------------------------

            recognition.start();

            mediaRecorder.start();

            recognitionRef.current = recognition;

        } catch (err) {
            console.error(err);
            alert("Microphone access denied");
        }
    };

    // ---------------------------------------------------
    // STOP
    // ---------------------------------------------------

    const stopReading = () => {
        recognitionRef.current?.stop();
    };

    // ---------------------------------------------------
    // RETRY
    // ---------------------------------------------------

    const retryReading = () => {
        if (isLocked) return;

        setStarted(false);

        setListening(false);

        setTranscript("");

        setHighlightIndex(-1);

        setAudioURL(null);

        setAccuracy(0);
    };

    // ---------------------------------------------------
    // RENDER CONTENT
    // ---------------------------------------------------

    const renderContent = () => {
        return words.map((word, i) => {
            const isHighlighted =
                started &&
                i <= highlightIndex;

            return (
                <span
                    key={i}
                    className={`
                        mr-2 inline-block rounded-lg
                        px-2 py-1 transition-all duration-200
                        ${
                            isHighlighted
                                ? "bg-green-200 text-green-900"
                                : "bg-transparent text-zinc-800"
                        }
                    `}
                >
                    {word}
                </span>
            );
        });
    };

    // ---------------------------------------------------
    // UI
    // ---------------------------------------------------

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ------------------------------------------------ */}
            {/* TEXT */}
            {/* ------------------------------------------------ */}

            <div
                className="
                    mb-8 text-center text-3xl
                    font-medium leading-[70px]
                    text-zinc-800
                "
            >
                {renderContent()}
            </div>

            {/* ------------------------------------------------ */}
            {/* BUTTONS */}
            {/* ------------------------------------------------ */}

            <div className="flex flex-wrap items-center justify-center gap-4">
                {!started ? (
                    <button
                        onClick={startReading}
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
                        🎤 Start Reading
                    </button>
                ) : listening ? (
                    <button
                        onClick={stopReading}
                        className="
                            rounded-2xl bg-red-600
                            px-6 py-4 text-lg font-semibold
                            text-white transition
                            hover:bg-red-700
                        "
                    >
                        ⏹ Stop Reading
                    </button>
                ) : (
                    <>
                        <button
                            onClick={startReading}
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
                            🔁 Read Again
                        </button>

                        <button
                            onClick={retryReading}
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
                            ♻ Retry
                        </button>
                    </>
                )}

                {uploading && (
                    <div className="text-sm font-medium text-zinc-500">
                        Uploading audio...
                    </div>
                )}
            </div>

            {/* ------------------------------------------------ */}
            {/* RESULT */}
            {/* ------------------------------------------------ */}

            {transcript && (
                <div
                    className="
                        mt-8 rounded-2xl border
                        border-zinc-200 bg-zinc-50 p-5
                    "
                >
                    <div className="mb-4">
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                            Transcript
                        </p>

                        <p className="text-lg text-zinc-800">
                            {transcript}
                        </p>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                            Accuracy
                        </p>

                        <p className="text-2xl font-bold text-green-600">
                            {accuracy}%
                        </p>
                    </div>

                    {audioURL && (
                        <div>
                            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                                Audio Preview
                            </p>

                            <audio
                                controls
                                src={audioURL}
                                className="w-full"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TextReading;