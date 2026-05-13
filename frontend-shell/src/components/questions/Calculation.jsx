import { useState, useEffect } from "react";

const Calculation = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    const [input, setInput] = useState("");
    const [result, setResult] = useState(null);

    // ---------------------------------------------------
    // LOAD SAVED RESPONSE
    // ---------------------------------------------------

    useEffect(() => {
        if (response?.value !== undefined) {
            setResult(response.value);
            setInput(response.steps || "");
        }
    }, [response]);

    // ---------------------------------------------------
    // INPUT HANDLING
    // ---------------------------------------------------

    const handleClick = (val) => {
        if (isLocked) return;

        setInput((prev) => prev + val);
    };

    const clear = () => {
        if (isLocked) return;

        setInput("");
        setResult(null);
    };

    const backspace = () => {
        if (isLocked) return;

        setInput((prev) => prev.slice(0, -1));
    };

    // ---------------------------------------------------
    // CALCULATE
    // ---------------------------------------------------

    const calculate = () => {
        try {
            // MVP SAFE-ish PARSE
            // eslint-disable-next-line no-eval
            const res = eval(input);

            setResult(res);

        } catch {
            alert("Invalid calculation");
        }
    };

    // ---------------------------------------------------
    // SAVE ANSWER
    // ---------------------------------------------------

    const confirmAnswer = () => {
        if (result === null) return;

        onAnswer({
            value: result,
            steps: input,
        });
    };

    // ---------------------------------------------------
    // QUESTION CONTENT
    // ---------------------------------------------------

    const renderContent = () => {
        return subQuestion?.content?.map((c, i) => {
            if (c.type === "text") {
                return (
                    <span key={i}>
                        {c.value}{" "}
                    </span>
                );
            }

            if (c.type === "image") {
                return (
                    <img
                        key={i}
                        src={c.value}
                        alt=""
                        className="max-h-32 rounded-xl object-contain"
                    />
                );
            }

            return null;
        });
    };

    // ---------------------------------------------------
    // BUTTONS
    // ---------------------------------------------------

    const buttons = [
        "7",
        "8",
        "9",
        "/",
        "4",
        "5",
        "6",
        "*",
        "1",
        "2",
        "3",
        "-",
        "0",
        ".",
        "=",
        "+",
    ];

    // ---------------------------------------------------
    // UI
    // ---------------------------------------------------

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ================================================= */}
            {/* QUESTION */}
            {/* ================================================= */}

            <div className="mb-6">
                <div className="flex flex-wrap items-center gap-4 text-2xl font-medium text-zinc-800">
                    {renderContent()}
                </div>
            </div>

            {/* ================================================= */}
            {/* DISPLAY */}
            {/* ================================================= */}

            <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="min-h-[48px] break-all text-right font-mono text-3xl font-semibold text-zinc-800">
                    {input || "0"}
                </div>

                {result !== null && (
                    <div className="mt-3 text-right text-xl font-medium text-green-600">
                        = {result}
                    </div>
                )}
            </div>

            {/* ================================================= */}
            {/* KEYPAD */}
            {/* ================================================= */}

            <div className="grid grid-cols-4 gap-3">
                {buttons.map((btn, i) => (
                    <button
                        key={i}
                        disabled={isLocked}
                        onClick={() =>
                            btn === "="
                                ? calculate()
                                : handleClick(btn)
                        }
                        className={`
                            h-16 rounded-2xl text-xl font-semibold transition-all
                            ${
                                btn === "="
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                            }
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        `}
                    >
                        {btn}
                    </button>
                ))}
            </div>

            {/* ================================================= */}
            {/* ACTIONS */}
            {/* ================================================= */}

            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    onClick={clear}
                    disabled={isLocked}
                    className="rounded-xl bg-red-100 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Clear
                </button>

                <button
                    onClick={backspace}
                    disabled={isLocked}
                    className="rounded-xl bg-zinc-200 px-5 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    ⌫ Backspace
                </button>

                {result !== null && (
                    <>
                        <button
                            onClick={confirmAnswer}
                            disabled={isLocked}
                            className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            ✅ Confirm Answer
                        </button>

                        <button
                            onClick={clear}
                            disabled={isLocked}
                            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            🔁 Retry
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Calculation;