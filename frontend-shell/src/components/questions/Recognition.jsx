import { useRef, useState } from "react";

const Recognition = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    const audioRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);

    const selected = response?.option_id;

    // ---------------------------------------------------
    // PLAY AUDIO
    // ---------------------------------------------------

    const playAudio = async () => {
        try {
            if (!audioRef.current) return;

            audioRef.current.currentTime = 0;

            setIsPlaying(true);

            await audioRef.current.play();

        } catch (err) {
            console.error(err);
            setIsPlaying(false);
        }
    };

    // ---------------------------------------------------
    // HANDLE AUDIO END
    // ---------------------------------------------------

    const handleEnded = () => {
        setIsPlaying(false);
    };

    // ---------------------------------------------------
    // HANDLE SELECT
    // ---------------------------------------------------

    const handleSelect = (optId) => {
        if (isLocked) return;

        onAnswer({
            option_id: optId,
        });
    };

    // ---------------------------------------------------
    // RENDER OPTION CONTENT
    // ---------------------------------------------------

    const renderOptionContent = (opt) => {
        if (opt.type === "image") {
            return (
                <img
                    src={opt.value}
                    alt={opt.alt || "option"}
                    className="
                        h-32 w-32 object-contain
                        md:h-40 md:w-40
                    "
                />
            );
        }

        return (
            <span className="text-2xl font-bold">
                {opt.value}
            </span>
        );
    };

    // ---------------------------------------------------
    // UI
    // ---------------------------------------------------

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ------------------------------------------------ */}
            {/* AUDIO */}
            {/* ------------------------------------------------ */}

            <audio
                ref={audioRef}
                src={subQuestion.stimulus.value}
                onEnded={handleEnded}
            />

            <div className="mb-10 flex justify-center">
                <button
                    onClick={playAudio}
                    className={`
                        flex h-28 w-28 items-center justify-center
                        rounded-full border-4 text-5xl
                        transition-all duration-200
                        ${
                            isPlaying
                                ? "border-indigo-600 bg-indigo-600 text-white scale-105"
                                : "border-zinc-300 bg-white text-zinc-700 hover:border-indigo-400 hover:bg-indigo-50"
                        }
                    `}
                >
                    🔊
                </button>
            </div>

            {/* ------------------------------------------------ */}
            {/* OPTIONS */}
            {/* ------------------------------------------------ */}

            <div
                className="
                    flex flex-wrap items-center justify-center
                    gap-5
                "
            >
                {subQuestion.options.map((opt) => {
                    const isSelected =
                        selected === opt.id;

                    return (
                        <button
                            key={opt.id}
                            onClick={() =>
                                handleSelect(opt.id)
                            }
                            disabled={isLocked}
                            className={`
                                flex min-h-[140px] min-w-[140px]
                                items-center justify-center
                                rounded-3xl border-2 bg-white
                                p-5 transition-all duration-200
                                ${
                                    isSelected
                                        ? "border-green-500 bg-green-50 scale-105"
                                        : "border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50"
                                }
                                ${
                                    isLocked
                                        ? "cursor-not-allowed opacity-70"
                                        : "cursor-pointer"
                                }
                            `}
                        >
                            {renderOptionContent(opt)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Recognition;