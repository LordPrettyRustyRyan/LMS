import { useState, useRef, useEffect } from "react";
import { uploadMedia } from "../../api/media";

const Comprehension = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    const [recordingId, setRecordingId] = useState(null);

    // ---------------- AUDIO RESPONSES ----------------
    const [audioMap, setAudioMap] = useState({});

    // ---------------- UPLOAD STATES ----------------
    const [uploadingMap, setUploadingMap] = useState({});

    // ---------------- TTS ----------------
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState("");
    const [rate, setRate] = useState(1);

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const mediaRecorderRef = useRef(null);

    // store chunks PER question
    const chunksRef = useRef({});

    const utteranceRef = useRef(null);

    // ===================================================
    // LOAD SAVED RESPONSES
    // ===================================================

    useEffect(() => {
        if (!response) return;

        // response can be:
        // { audio_url: "" }
        // OR map object

        if (response.audio_url) {
            setAudioMap((prev) => ({
                ...prev,
                [response.question_id || "default"]:
                    response.audio_url,
            }));
        } else {
            setAudioMap(response);
        }
    }, [response]);

    // ===================================================
    // LOAD BROWSER VOICES
    // ===================================================

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices =
                window.speechSynthesis.getVoices();

            setVoices(availableVoices);

            if (
                availableVoices.length &&
                !selectedVoice
            ) {
                setSelectedVoice(
                    availableVoices[0].name
                );
            }
        };

        loadVoices();

        window.speechSynthesis.onvoiceschanged =
            loadVoices;

        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // ===================================================
    // TTS
    // ===================================================

    const getPassageText = () => {
        return (
            subQuestion?.content
                ?.map((c) =>
                    c.type === "text" ? c.value : ""
                )
                .join(" ") || ""
        );
    };

    const playTTS = () => {
        const text = getPassageText();

        if (!text) return;

        window.speechSynthesis.cancel();

        const utter =
            new SpeechSynthesisUtterance(text);

        utter.rate = rate;

        const chosenVoice = voices.find(
            (v) => v.name === selectedVoice
        );

        if (chosenVoice) {
            utter.voice = chosenVoice;
        }

        utter.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);
        };

        utter.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        utter.onerror = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        utteranceRef.current = utter;

        window.speechSynthesis.speak(utter);
    };

    const pauseTTS = () => {
        window.speechSynthesis.pause();
        setIsPaused(true);
    };

    const resumeTTS = () => {
        window.speechSynthesis.resume();
        setIsPaused(false);
    };

    const stopTTS = () => {
        window.speechSynthesis.cancel();

        setIsSpeaking(false);
        setIsPaused(false);
    };

    // ===================================================
    // RECORDING
    // ===================================================

    const startRecording = async (qId) => {
        if (isLocked) return;

        try {
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });

            const recorder = new MediaRecorder(stream);

            mediaRecorderRef.current = recorder;

            chunksRef.current[qId] = [];

            recorder.ondataavailable = (e) => {
                chunksRef.current[qId].push(e.data);
            };

            recorder.onstop = async () => {
                try {
                    const blob = new Blob(
                        chunksRef.current[qId],
                        {
                            type: "audio/webm",
                        }
                    );

                    // -----------------------------------
                    // LOCAL PREVIEW
                    // -----------------------------------

                    const localUrl =
                        URL.createObjectURL(blob);

                    setAudioMap((prev) => ({
                        ...prev,
                        [qId]: localUrl,
                    }));

                    // -----------------------------------
                    // SHOW LOADING
                    // -----------------------------------

                    setUploadingMap((prev) => ({
                        ...prev,
                        [qId]: true,
                    }));

                    // -----------------------------------
                    // FILE
                    // -----------------------------------

                    const file = new File(
                        [blob],
                        `comprehension-${qId}-${Date.now()}.webm`,
                        {
                            type: "audio/webm",
                        }
                    );

                    // -----------------------------------
                    // CLOUDINARY UPLOAD
                    // -----------------------------------

                    const uploadRes =
                        await uploadMedia(
                            file,
                            "comprehension_answers"
                        );

                    const cloudUrl =
                        uploadRes?.data?.url;

                    if (!cloudUrl) {
                        throw new Error(
                            "Cloudinary upload failed"
                        );
                    }

                    // -----------------------------------
                    // SAVE FINAL CLOUD URL
                    // -----------------------------------

                    setAudioMap((prev) => ({
                        ...prev,
                        [qId]: cloudUrl,
                    }));

                    // -----------------------------------
                    // SAVE TO DB
                    // -----------------------------------

                    await onAnswer({
                        audio_url: cloudUrl,
                        transcript: "",
                        question_id: qId,
                    });

                } catch (err) {
                    console.error(err);

                    alert(
                        "Failed to upload audio"
                    );
                } finally {
                    setUploadingMap((prev) => ({
                        ...prev,
                        [qId]: false,
                    }));

                    stream
                        .getTracks()
                        .forEach((t) => t.stop());
                }
            };

            recorder.start();

            setRecordingId(qId);

        } catch (err) {
            console.error(err);

            alert("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecordingId(null);
        }
    };

    // ===================================================
    // REMOVE / RETRY ANSWER
    // ===================================================

    const retryAnswer = (qId) => {
        if (isLocked) return;

        setAudioMap((prev) => {
            const updated = { ...prev };

            delete updated[qId];

            return updated;
        });

        startRecording(qId);
    };

    // ===================================================
    // RENDER CONTENT
    // ===================================================

    const renderContent = () => {
        return subQuestion?.content?.map((c, i) => {
            if (c.type === "text") {
                return (
                    <p
                        key={i}
                        className="text-lg leading-8 text-zinc-700"
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
                        className="mt-4 rounded-2xl border border-zinc-200"
                    />
                );
            }

            if (c.type === "audio") {
                return (
                    <audio
                        key={i}
                        controls
                        className="mt-4 w-full"
                    >
                        <source src={c.value} />
                    </audio>
                );
            }

            return null;
        });
    };

    // ===================================================
    // UI
    // ===================================================

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            
            {/* ========================================== */}
            {/* PASSAGE */}
            {/* ========================================== */}

            <div className="mb-8">
                <div className="space-y-4">
                    {renderContent()}
                </div>

                {/* -------------------------------------- */}
                {/* TTS CONTROLS */}
                {/* -------------------------------------- */}

                {subQuestion?.tts && (
                    <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                        
                        {/* SETTINGS */}
                        <div className="mb-5 flex flex-col gap-5 lg:flex-row">
                            
                            {/* VOICES */}
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Voice
                                </label>

                                <select
                                    value={selectedVoice}
                                    onChange={(e) =>
                                        setSelectedVoice(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                                >
                                    {voices.map((voice) => (
                                        <option
                                            key={voice.name}
                                            value={voice.name}
                                        >
                                            {voice.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* SPEED */}
                            <div className="w-full lg:w-72">
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Speed:{" "}
                                    {rate.toFixed(1)}x
                                </label>

                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={rate}
                                    onChange={(e) =>
                                        setRate(
                                            Number(
                                                e.target.value
                                            )
                                        )
                                    }
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div className="flex flex-wrap gap-3">
                            
                            <button
                                onClick={playTTS}
                                className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                            >
                                ▶ Play
                            </button>

                            {isSpeaking &&
                                !isPaused && (
                                    <button
                                        onClick={pauseTTS}
                                        className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-white transition hover:bg-yellow-600"
                                    >
                                        ⏸ Pause
                                    </button>
                                )}

                            {isPaused && (
                                <button
                                    onClick={resumeTTS}
                                    className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                                >
                                    ▶ Resume
                                </button>
                            )}

                            {(isSpeaking ||
                                isPaused) && (
                                <button
                                    onClick={stopTTS}
                                    className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                                >
                                    ⏹ Stop
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* QUESTIONS */}
            {/* ========================================== */}

            <div className="space-y-6">
                {subQuestion?.questions?.map((q) => {
                    const key = q.id;

                    const hasAnswer =
                        !!audioMap[key];

                    return (
                        <div
                            key={q.id}
                            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                        >
                            
                            {/* QUESTION */}
                            <h4 className="mb-5 text-lg font-semibold text-zinc-800">
                                {q.text}
                            </h4>

                            {/* ---------------------------------- */}
                            {/* ACTION BUTTONS */}
                            {/* ---------------------------------- */}

                            <div className="flex flex-wrap items-center gap-3">
                                
                                {recordingId !== key ? (
                                    hasAnswer ? (
                                        <button
                                            onClick={() =>
                                                retryAnswer(
                                                    key
                                                )
                                            }
                                            disabled={
                                                isLocked
                                            }
                                            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            🔁 Retry Answer
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                startRecording(
                                                    key
                                                )
                                            }
                                            disabled={
                                                isLocked
                                            }
                                            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            🎤 Record Answer
                                        </button>
                                    )
                                ) : (
                                    <button
                                        onClick={
                                            stopRecording
                                        }
                                        className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                                    >
                                        ⏹ Stop Recording
                                    </button>
                                )}

                                {uploadingMap[key] && (
                                    <span className="text-sm font-medium text-zinc-500">
                                        Uploading...
                                    </span>
                                )}
                            </div>

                            {/* ---------------------------------- */}
                            {/* AUDIO PREVIEW */}
                            {/* ---------------------------------- */}

                            {audioMap[key] && (
                                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="text-lg">
                                            ✅
                                        </span>

                                        <p className="font-semibold text-emerald-700">
                                            Saved
                                            Recording
                                        </p>
                                    </div>

                                    <audio
                                        controls
                                        src={
                                            audioMap[
                                                key
                                            ]
                                        }
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Comprehension;