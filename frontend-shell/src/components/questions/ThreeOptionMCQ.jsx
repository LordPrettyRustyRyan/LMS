const ThreeOptionMCQ = ({
    question,
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // ---------------- GET SELECTED ----------------

    const selectedOptionId = response?.option_id;

    // ---------------- GET SELECTED OPTION ----------------

    const selectedOption = subQuestion.options.find(
        (opt) => opt.id === selectedOptionId
    );

    // ---------------- RENDER CONTENT ----------------

    const renderContent = () => {
        return subQuestion.content.map((c, i) => {
            if (c.type === "text") {
                return (
                    <span key={i}>
                        {c.value}{" "}
                    </span>
                );
            }

            if (c.type === "blank") {
                return (
                    <span
                        key={i}
                        className="mx-2 inline-flex min-w-[90px] items-center justify-center rounded-lg border-b-4 border-slate-700 px-3 py-1 text-indigo-600"
                    >
                        {selectedOption
                            ? selectedOption.alt || selectedOption.value
                            : "____"}
                    </span>
                );
            }

            return null;
        });
    };

    // ---------------- RENDER OPTION ----------------

    const renderOption = (opt) => {
        const isSelected = selectedOptionId === opt.id;

        return (
            <button
                key={opt.id}
                type="button"
                disabled={isLocked}
                onClick={() =>
                    onAnswer({
                        type: "mcq",
                        option_id: opt.id,
                    })
                }
                className={`
                    group relative flex h-[220px] w-[220px]
                    items-center justify-center overflow-hidden
                    rounded-3xl border-2 bg-white p-5
                    transition-all duration-200

                    ${
                        isSelected
                            ? "border-emerald-500 ring-4 ring-emerald-100 scale-[1.02]"
                            : "border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1"
                    }

                    ${
                        isLocked
                            ? "cursor-not-allowed opacity-80"
                            : "cursor-pointer"
                    }
                `}
            >
                {/* SELECTED BADGE */}

                {isSelected && (
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                        Selected
                    </div>
                )}

                {/* TEXT OPTION */}

                {opt.type === "text" && (
                    <div className="text-center text-7xl font-bold text-slate-800">
                        {opt.value}
                    </div>
                )}

                {/* IMAGE OPTION */}

                {opt.type === "image" && (
                    <img
                        src={opt.value}
                        alt={opt.alt || "option"}
                        className="max-h-full max-w-full object-contain"
                    />
                )}
            </button>
        );
    };

    // ---------------- UI ----------------

    return (
        <div className="w-full">
            {/* QUESTION */}

            <div className="mb-8 text-center text-2xl font-semibold leading-relaxed text-slate-800">
                {renderContent()}
            </div>

            {/* OPTIONS */}

            <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:flex-wrap">
                {subQuestion.options.map(renderOption)}
            </div>
        </div>
    );
};

export default ThreeOptionMCQ;
