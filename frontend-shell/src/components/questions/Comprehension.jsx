import {
    useState,
    useRef,
    useEffect,
} from "react";

import {
    Play,
    Pause,
    Square,
    Mic,
    RotateCcw,
    Loader2,
    CheckCircle2,
} from "lucide-react";

import { uploadMedia } from "../../api/media";

const Comprehension = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // ===================================================
    // STATES
    // ===================================================

    const [recordingId, setRecordingId] =
        useState(null);

    const [audioMap, setAudioMap] =
        useState({});

    const [uploadingMap, setUploadingMap] =
        useState({});

    // ---------------- TTS ----------------

    const [voices, setVoices] = useState(
        []
    );

    const [selectedVoice, setSelectedVoice] =
        useState("");

    const [rate, setRate] = useState(1);

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    const [isPaused, setIsPaused] =
        useState(false);

    // ===================================================
    // REFS
    // ===================================================

    const mediaRecorderRef = useRef(null);

    const streamRef = useRef(null);

    const chunksRef = useRef({});

    const utteranceRef = useRef(null);

    // ===================================================
    // LOAD SAVED RESPONSES
    // ===================================================

    useEffect(() => {
        if (!response) return;

        // already normalized object
        if (
            typeof response === "object" &&
            !Array.isArray(response)
        ) {
            if (
                response.audio_url &&
                response.question_id
            ) {
                setAudioMap((prev) => ({
                    ...prev,
                    [response.question_id]:
                        response.audio_url,
                }));
            } else {
                setAudioMap((prev) => ({
                    ...prev,
                    ...response,
                }));
            }
        }
    }, [response]);

    // ===================================================
    // LOAD BROWSER VOICES
    // FIXES:
    // - empty voices issue
    // - chrome delayed loading
    // - safari delayed loading
    // ===================================================

    useEffect(() => {
        let mounted = true;

        const loadVoices = () => {
            const availableVoices =
                window.speechSynthesis.getVoices();

            if (
                !availableVoices ||
                !availableVoices.length
            ) {
                return;
            }

            if (!mounted) return;

            setVoices(availableVoices);

            setSelectedVoice((prev) => {
                if (prev) return prev;

                const englishVoice =
                    availableVoices.find((v) =>
                        v.lang?.startsWith(
                            "en"
                        )
                    );

                return (
                    englishVoice?.name ||
                    availableVoices[0]?.name ||
                    ""
                );
            });
        };

        loadVoices();

        window.speechSynthesis.onvoiceschanged =
            loadVoices;

        const interval = setInterval(() => {
            if (!voices.length) {
                loadVoices();
            }
        }, 1000);

        return () => {
            mounted = false;

            clearInterval(interval);

            window.speechSynthesis.cancel();

            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) =>
                        track.stop()
                    );
            }
        };
    }, []);

    // ===================================================
    // PASSAGE TEXT
    // ===================================================

    const getPassageText = () => {
        return (
            subQuestion?.content
                ?.map((c) =>
                    c.type === "text"
                        ? c.value
                        : ""
                )
                .join(" ") || ""
        );
    };

    // ===================================================
    // TTS CONTROLS
    // ===================================================

    const playTTS = () => {
        const text = getPassageText();

        if (!text) return;

        window.speechSynthesis.cancel();

        const utter =
            new SpeechSynthesisUtterance(
                text
            );

        utter.rate = rate;

        const selected =
            voices.find(
                (v) =>
                    v.name === selectedVoice
            );

        if (selected) {
            utter.voice = selected;
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
    // START RECORDING
    // ===================================================

    const startRecording = async (qId) => {
        if (isLocked) return;

        try {
            // stop old stream if exists
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) =>
                        track.stop()
                    );
            }

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        audio: true,
                    }
                );

            streamRef.current = stream;

            const recorder =
                new MediaRecorder(stream);

            mediaRecorderRef.current =
                recorder;

            chunksRef.current[qId] = [];

            recorder.ondataavailable = (
                e
            ) => {
                if (e.data.size > 0) {
                    chunksRef.current[
                        qId
                    ].push(e.data);
                }
            };

            recorder.onstop = async () => {
                try {
                    const audioChunks =
                        chunksRef.current[
                        qId
                        ];

                    if (
                        !audioChunks ||
                        !audioChunks.length
                    ) {
                        throw new Error(
                            "No audio recorded"
                        );
                    }

                    // -----------------------------------
                    // BLOB
                    // -----------------------------------

                    const blob = new Blob(
                        audioChunks,
                        {
                            type: "audio/webm",
                        }
                    );

                    // -----------------------------------
                    // LOCAL PREVIEW
                    // -----------------------------------

                    const localUrl =
                        URL.createObjectURL(
                            blob
                        );

                    setAudioMap((prev) => ({
                        ...prev,
                        [qId]: localUrl,
                    }));

                    // -----------------------------------
                    // LOADING
                    // -----------------------------------

                    setUploadingMap(
                        (prev) => ({
                            ...prev,
                            [qId]: true,
                        })
                    );

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
                    // UPLOAD
                    // -----------------------------------

                    const uploadRes =
                        await uploadMedia(
                            file,
                            "assignment-audio"
                        );

                    const cloudUrl =
                        uploadRes?.data?.url;

                    if (!cloudUrl) {
                        throw new Error(
                            "Upload failed"
                        );
                    }

                    // -----------------------------------
                    // UPDATE UI
                    // -----------------------------------

                    setAudioMap((prev) => ({
                        ...prev,
                        [qId]: cloudUrl,
                    }));

                    // -----------------------------------
                    // IMPORTANT FIX:
                    // save EXACT structure expected
                    // by AssignmentPlayer
                    // -----------------------------------

                    await onAnswer({
                        connections: undefined,
                        audio_url:
                            cloudUrl,
                        transcript: "",
                        question_id:
                            qId,
                    });
                } catch (err) {
                    console.error(err);

                    alert(
                        "Failed to upload recording"
                    );
                } finally {
                    setUploadingMap(
                        (prev) => ({
                            ...prev,
                            [qId]: false,
                        })
                    );

                    if (
                        streamRef.current
                    ) {
                        streamRef.current
                            .getTracks()
                            .forEach(
                                (track) =>
                                    track.stop()
                            );
                    }
                }
            };

            recorder.start();

            setRecordingId(qId);
        } catch (err) {
            console.error(err);

            alert(
                "Microphone access denied"
            );
        }
    };

    // ===================================================
    // STOP RECORDING
    // ===================================================

    const stopRecording = () => {
        try {
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current
                    .state !== "inactive"
            ) {
                mediaRecorderRef.current.stop();
            }
        } catch (err) {
            console.error(err);
        }

        setRecordingId(null);
    };

    // ===================================================
    // RETRY
    // ===================================================

    const retryAnswer = async (qId) => {
        if (isLocked) return;

        setAudioMap((prev) => {
            const updated = {
                ...prev,
            };

            delete updated[qId];

            return updated;
        });

        await startRecording(qId);
    };

    // ===================================================
    // RENDER CONTENT
    // ===================================================

    const renderContent = () => {
        return subQuestion?.content?.map(
            (c, i) => {
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

                if (
                    c.type === "image"
                ) {
                    return (
                        <img
                            key={i}
                            src={c.value}
                            alt=""
                            className="mt-4 rounded-2xl border border-zinc-200"
                        />
                    );
                }

                if (
                    c.type === "audio"
                ) {
                    return (
                        <audio
                            key={i}
                            controls
                            className="mt-4 w-full"
                        >
                            <source
                                src={
                                    c.value
                                }
                            />
                        </audio>
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
            {/* ====================================== */}
            {/* PASSAGE */}
            {/* ====================================== */}

            <div className="mb-8">
                <div className="space-y-4">
                    {renderContent()}
                </div>

                {/* ================================== */}
                {/* TTS */}
                {/* ================================== */}

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
                                    value={
                                        selectedVoice
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setSelectedVoice(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                                >
                                    {voices.map(
                                        (
                                            voice
                                        ) => (
                                            <option
                                                key={
                                                    voice.name
                                                }
                                                value={
                                                    voice.name
                                                }
                                            >
                                                {
                                                    voice.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* SPEED */}

                            <div className="w-full lg:w-72">
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Speed:{" "}
                                    {rate.toFixed(
                                        1
                                    )}
                                    x
                                </label>

                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={rate}
                                    onChange={(
                                        e
                                    ) =>
                                        setRate(
                                            Number(
                                                e
                                                    .target
                                                    .value
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
                                onClick={
                                    playTTS
                                }
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                            >
                                <Play size={18} />

                                Play
                            </button>

                            {isSpeaking &&
                                !isPaused && (
                                    <button
                                        onClick={
                                            pauseTTS
                                        }
                                        className="flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-white transition hover:bg-yellow-600"
                                    >
                                        <Pause
                                            size={
                                                18
                                            }
                                        />

                                        Pause
                                    </button>
                                )}

                            {isPaused && (
                                <button
                                    onClick={
                                        resumeTTS
                                    }
                                    className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                                >
                                    <Play
                                        size={
                                            18
                                        }
                                    />

                                    Resume
                                </button>
                            )}

                            {(isSpeaking ||
                                isPaused) && (
                                    <button
                                        onClick={
                                            stopTTS
                                        }
                                        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                                    >
                                        <Square
                                            size={
                                                18
                                            }
                                        />

                                        Stop
                                    </button>
                                )}
                        </div>
                    </div>
                )}
            </div>

            {/* ====================================== */}
            {/* QUESTIONS */}
            {/* ====================================== */}

            <div className="space-y-6">
                {subQuestion?.questions?.map(
                    (q) => {
                        const key =
                            q.id;

                        const hasAnswer =
                            !!audioMap[
                            key
                            ];

                        return (
                            <div
                                key={
                                    q.id
                                }
                                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                            >
                                {/* QUESTION */}

                                <h4 className="mb-5 text-lg font-semibold text-zinc-800">
                                    {
                                        q.text
                                    }
                                </h4>

                                {/* ACTIONS */}

                                <div className="flex flex-wrap items-center gap-3">
                                    {recordingId !==
                                        key ? (
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
                                                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <RotateCcw
                                                    size={
                                                        18
                                                    }
                                                />

                                                Retry
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
                                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Mic
                                                    size={
                                                        18
                                                    }
                                                />

                                                Record
                                            </button>
                                        )
                                    ) : (
                                        <button
                                            onClick={
                                                stopRecording
                                            }
                                            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                                        >
                                            <Square
                                                size={
                                                    18
                                                }
                                            />

                                            Stop
                                        </button>
                                    )}

                                    {uploadingMap[
                                        key
                                    ] && (
                                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                                                <Loader2
                                                    size={
                                                        16
                                                    }
                                                    className="animate-spin"
                                                />

                                                Uploading...
                                            </div>
                                        )}
                                </div>

                                {/* AUDIO */}

                                {audioMap[
                                    key
                                ] && (
                                        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                            <div className="mb-3 flex items-center gap-2">
                                                <CheckCircle2
                                                    size={
                                                        20
                                                    }
                                                    className="text-emerald-600"
                                                />

                                                <p className="font-semibold text-emerald-700">
                                                    Recording
                                                    Saved
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
                    }
                )}
            </div>
        </div>
    );
};

export default Comprehension;
