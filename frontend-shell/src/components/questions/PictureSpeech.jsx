import { useEffect, useRef, useState } from "react";
import { uploadMedia } from "../../api/media";

const PictureSpeech = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // =====================================================
    // RECORDING STATES
    // =====================================================

    const [recording, setRecording] =
        useState(false);

    const [audioURL, setAudioURL] =
        useState(null);

    const [uploading, setUploading] =
        useState(false);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // =====================================================
    // TTS STATES
    // =====================================================

    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] =
        useState("");

    const [rate, setRate] = useState(1);

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    const [isPaused, setIsPaused] =
        useState(false);

    const utteranceRef = useRef(null);

    // =====================================================
    // LOAD SAVED RESPONSE
    // =====================================================

    useEffect(() => {
        if (response?.audio_url) {
            setAudioURL(response.audio_url);
        }
    }, [response]);

    // =====================================================
    // LOAD BROWSER VOICES
    // =====================================================

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
    }, [selectedVoice]);

    // =====================================================
    // TTS
    // =====================================================

    const playTTS = (text) => {
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

    // =====================================================
    // RECORDING
    // =====================================================

    const startRecording = async () => {
        if (isLocked) return;

        try {
            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        audio: true,
                    }
                );

            const recorder =
                new MediaRecorder(stream);

            mediaRecorderRef.current = recorder;

            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
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

                    setAudioURL(localUrl);

                    setUploading(true);

                    // -----------------------------------------
                    // CLOUDINARY UPLOAD
                    // -----------------------------------------

                    const file = new File(
                        [blob],
                        `picture-speech-${Date.now()}.webm`,
                        {
                            type: "audio/webm",
                        }
                    );

                    const uploadRes =
                        await uploadMedia(
                            file,
                            "assignment-picture-speech"
                        );

                    const cloudUrl =
                        uploadRes?.data?.url;

                    // -----------------------------------------
                    // FINAL CLOUD URL
                    // -----------------------------------------

                    setAudioURL(cloudUrl);

                    // -----------------------------------------
                    // SAVE RESPONSE
                    // -----------------------------------------

                    await onAnswer({
                        audio_url: cloudUrl,
                        transcript: "",
                    });
                } catch (err) {
                    console.error(err);
                    alert("Audio upload failed");
                } finally {
                    setUploading(false);

                    stream
                        .getTracks()
                        .forEach((t) => t.stop());
                }
            };

            recorder.start();

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
    // CLEAR / RETRY
    // =====================================================

    const handleRetry = () => {
        if (isLocked) return;

        setAudioURL(null);

        onAnswer({
            audio_url: "",
            transcript: "",
        });
    };

    // =====================================================
    // EXTRACT CONTENT
    // =====================================================

    const imageContent =
        subQuestion?.content?.find(
            (c) => c.type === "image"
        );

    const textContent =
        subQuestion?.content?.find(
            (c) => c.type === "text"
        );

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ================================================= */}
            {/* TTS SECTION */}
            {/* ================================================= */}

            {subQuestion?.tts && (
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                    {/* ================================================= */}
                    {/* 1 : 2 LAYOUT */}
                    {/* ================================================= */}

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* ================================================= */}
                        {/* LEFT SIDE : IMAGE (1 PART) */}
                        {/* ================================================= */}

                        <div className="lg:col-span-1">
                            {imageContent && (
                                <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
                                    <img
                                        src={
                                            imageContent.value
                                        }
                                        alt="question"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* ================================================= */}
                        {/* RIGHT SIDE : CONTROLS (2 PARTS) */}
                        {/* ================================================= */}

                        <div className="space-y-6 lg:col-span-2">
                            {/* TEXT */}
                            {textContent && (
                                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                                    <p className="text-lg leading-8 text-zinc-700">
                                        {
                                            textContent.value
                                        }
                                    </p>
                                </div>
                            )}

                            {/* VOICE */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                                    Voice
                                </label>

                                <select
                                    value={
                                        selectedVoice
                                    }
                                    onChange={(e) =>
                                        setSelectedVoice(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500"
                                >
                                    {voices.map(
                                        (voice) => (
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
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-zinc-700">
                                        Playback
                                        Speed
                                    </label>

                                    <span className="text-sm font-medium text-indigo-600">
                                        {rate.toFixed(
                                            1
                                        )}
                                        x
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={rate}
                                    onChange={(e) =>
                                        setRate(
                                            Number(
                                                e
                                                    .target
                                                    .value
                                            )
                                        )
                                    }
                                    className="w-full accent-indigo-600"
                                />
                            </div>

                            {/* BUTTONS */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() =>
                                        playTTS(
                                            subQuestion.display_text
                                        )
                                    }
                                    className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    ▶ Play Instruction
                                </button>

                                {isSpeaking &&
                                    !isPaused && (
                                        <button
                                            onClick={
                                                pauseTTS
                                            }
                                            className="rounded-2xl bg-yellow-500 px-5 py-3 font-semibold text-white transition hover:bg-yellow-600"
                                        >
                                            ⏸ Pause
                                        </button>
                                    )}

                                {isPaused && (
                                    <button
                                        onClick={
                                            resumeTTS
                                        }
                                        className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                                    >
                                        ▶ Resume
                                    </button>
                                )}

                                {(isSpeaking ||
                                    isPaused) && (
                                    <button
                                        onClick={
                                            stopTTS
                                        }
                                        className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                                    >
                                        ⏹ Stop
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* RECORDING SECTION */}
            {/* ================================================= */}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {!recording ? (
                    audioURL ? (
                        <button
                            onClick={startRecording}
                            disabled={isLocked}
                            className="rounded-2xl bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            🔁 Retry Recording
                        </button>
                    ) : (
                        <button
                            onClick={startRecording}
                            disabled={isLocked}
                            className="rounded-2xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            🎤 Record Answer
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
                {audioURL && !recording && (
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
            {/* AUDIO PLAYER */}
            {/* ================================================= */}

            {audioURL && (
                <div className="mt-8">
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

export default PictureSpeech;