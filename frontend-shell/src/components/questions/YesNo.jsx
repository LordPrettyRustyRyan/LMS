const YesNo = ({
    question,
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* QUESTION */}

            <div className="mb-8 text-center text-2xl font-semibold leading-relaxed text-slate-800">
                {subQuestion.content?.map((c, i) => (
                    <span key={i} className="mr-2">
                        {c.value}
                    </span>
                ))}
            </div>

            {/* OPTIONS */}

            <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
                {subQuestion.options?.map((opt) => {
                    const isSelected =
                        response?.option_id === opt.id;

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            disabled={isLocked}
                            onClick={() =>
                                onAnswer({
                                    option_id: opt.id,
                                })
                            }
                            className={`
                                flex h-28 w-full max-w-[240px]
                                items-center justify-center
                                rounded-3xl border-2
                                text-3xl font-bold
                                transition-all duration-200

                                ${
                                    isSelected
                                        ? "border-emerald-500 bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-100 scale-[1.02]"
                                        : "border-slate-200 bg-white text-slate-800 hover:border-indigo-400 hover:shadow-md hover:-translate-y-1"
                                }

                                ${
                                    isLocked
                                        ? "cursor-not-allowed opacity-70"
                                        : "cursor-pointer"
                                }
                            `}
                        >
                            {opt.value}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default YesNo;