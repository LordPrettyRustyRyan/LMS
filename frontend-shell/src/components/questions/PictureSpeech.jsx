import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";

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
    // LOAD SAVED RESPONSE
    // =====================================================

    useEffect(() => {
        if (response?.audio_url) {
            setAudioURL(response.audio_url);
        }
    }, [response]);

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

                    alert(
                        "Audio upload failed"
                    );
                } finally {
                    setUploading(false);

                    stream
                        .getTracks()
                        .forEach((t) =>
                            t.stop()
                        );
                }
            };

            recorder.start();

            setRecording(true);

        } catch (err) {
            console.error(err);

            alert(
                "Microphone access denied"
            );
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();

            setRecording(false);
        }
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
            {/* MAIN LAYOUT */}
            {/* ================================================= */}

            <div className="grid gap-8 lg:grid-cols-2">
                
                {/* ================================================= */}
                {/* LEFT : IMAGE */}
                {/* ================================================= */}

                <div>
                    {imageContent && (
                        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50">
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
                {/* RIGHT : RECORDING */}
                {/* ================================================= */}

                <div className="flex flex-col justify-center">
                    
                    {/* TEXT */}
                    {textContent && (
                        <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                            <p className="text-lg leading-8 text-zinc-700">
                                {
                                    textContent.value
                                }
                            </p>
                        </div>
                    )}

                    {/* BUTTON */}
                    <div className="flex flex-wrap items-center gap-4">
                        
                        {!recording ? (
                            <button
                                onClick={
                                    startRecording
                                }
                                disabled={
                                    isLocked
                                }
                                className="
                                    inline-flex items-center gap-3
                                    rounded-2xl bg-indigo-600
                                    px-6 py-4 text-lg font-semibold
                                    text-white transition
                                    hover:bg-indigo-700
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                {audioURL ? (
                                    <>
                                        <RotateCcw size={22} />
                                        Retry Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic size={22} />
                                        Record Answer
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={
                                    stopRecording
                                }
                                className="
                                    inline-flex items-center gap-3
                                    rounded-2xl bg-red-600
                                    px-6 py-4 text-lg font-semibold
                                    text-white transition
                                    hover:bg-red-700
                                "
                            >
                                <Square size={20} />
                                Stop Recording
                            </button>
                        )}

                        {/* UPLOADING */}
                        {uploading && (
                            <div className="text-sm font-medium text-zinc-500">
                                Uploading audio...
                            </div>
                        )}
                    </div>

                    {/* ================================================= */}
                    {/* AUDIO PREVIEW */}
                    {/* ================================================= */}

                    {audioURL && (
                        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                            
                            <div className="mb-3 flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                                <p className="font-semibold text-emerald-700">
                                    Recording Saved
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
            </div>
        </div>
    );
};

export default PictureSpeech;
