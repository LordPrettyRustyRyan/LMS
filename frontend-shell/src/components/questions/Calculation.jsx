import { useEffect, useState } from "react";

import {
    Check,
    Delete,
    RotateCcw,
    Equal,
} from "lucide-react";

const Calculation = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // ===================================================
    // STATES
    // ===================================================

    const [input, setInput] =
        useState("");

    const [result, setResult] =
        useState(null);

    // ===================================================
    // CONFIG
    // ===================================================

    const calculatorConfig =
        subQuestion?.calculator_config || {};

    const allowDecimal =
        calculatorConfig.allow_decimal ??
        true;

    const operators =
        calculatorConfig.operators || [
            "+",
            "-",
            "*",
            "/",
        ];

    const maxDigits =
        calculatorConfig.max_digits || 10;

    // ===================================================
    // LOAD SAVED RESPONSE
    // ===================================================

    useEffect(() => {
        if (
            response?.value !== undefined
        ) {
            setResult(response.value);

            setInput(
                response.steps || ""
            );
        }
    }, [response]);

    // ===================================================
    // TTS
    // ===================================================

    const speak = (text) => {
        if (!subQuestion?.tts) return;

        window.speechSynthesis.cancel();

        const utter =
            new SpeechSynthesisUtterance(
                text
            );

        utter.rate = 1;

        window.speechSynthesis.speak(
            utter
        );
    };

    const speakButton = (btn) => {
        const map = {
            "+": "plus",
            "-": "minus",
            "*": "multiply by",
            "/": "divide by",
            "=": "equals",
            ".": "decimal",
            "clear": "decimal",
        };

        speak(map[btn] || btn);
    };

    // ===================================================
    // INPUT
    // ===================================================

    const handleClick = (val) => {
        if (isLocked) return;

        // max digits check
        const numericChars =
            input.replace(/\D/g, "");

        if (
            /\d/.test(val) &&
            numericChars.length >= maxDigits
        ) {
            return;
        }

        // decimal restriction
        if (
            val === "." &&
            !allowDecimal
        ) {
            return;
        }

        speakButton(val);

        setInput((prev) => prev + val);
    };

    // ===================================================
    // CLEAR
    // ===================================================

    const clear = () => {
        if (isLocked) return;

        speak("clear");

        setInput("");
        setResult(null);
    };

    // ===================================================
    // BACKSPACE
    // ===================================================

    const backspace = () => {
        if (isLocked) return;

        speak("back");

        setInput((prev) =>
            prev.slice(0, -1)
        );
    };



    // ---------------------------------------------------
    // CALCULATE
    // ---------------------------------------------------

    const calculate = () => {
        try {
            // eslint-disable-next-line no-eval
            const res = eval(input);

            setResult(res);

            // ✅ SPEAK RESULT
            speak(`equals to ${res}`);

        } catch {
            alert("Invalid calculation");
        }
    };

    // ===================================================
    // SAVE ANSWER
    // ===================================================

    const confirmAnswer = () => {
        if (result === null) return;

        speak(
            `answer confirmed, your answer is ${result}`
        );

        onAnswer({
            value: result,
            steps: input,
        });
    };

    // ===================================================
    // QUESTION CONTENT
    // ===================================================

    const renderQuestion = () => {
        return subQuestion?.content?.map(
            (c, i) => {
                // TEXT
                if (c.type === "text") {
                    return (
                        <span key={i}>
                            {c.value}
                        </span>
                    );
                }

                // BLANK
                if (c.type === "blank") {
                    return (
                        <span
                            key={i}
                            className="
                                inline-flex
                                min-w-22.5
                                items-center
                                justify-center
                                rounded-xl
                                border-b-4
                                border-indigo-400
                                px-4
                                py-2
                                text-indigo-700
                            "
                        >
                            {result !== null
                                ? result
                                : "?"}
                        </span>
                    );
                }

                // IMAGE
                if (c.type === "image") {
                    return (
                        <img
                            key={i}
                            src={c.value}
                            alt=""
                            className="max-h-28 rounded-2xl object-contain"
                        />
                    );
                }

                return null;
            }
        );
    };

    // ===================================================
    // BUTTONS
    // ===================================================

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
        " ",
        "=",
        "+",
    ].filter(Boolean);

    // ===================================================
    // DISPLAY SYMBOL
    // ===================================================

    const displaySymbol = (btn) => {
        if (btn === "/") return "÷";
        if (btn === "*") return "×";

        return btn;
    };

    // ===================================================
    // UI
    // ===================================================

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* ========================================= */}
            {/* QUESTION */}
            {/* ========================================= */}

            <div className="mb-8 flex justify-center">
                <div
                    className="
                        flex
                        flex-wrap
                        items-center
                        justify-center
                        gap-4
                        rounded-3xl
                        bg-zinc-50
                        px-8
                        py-6
                        text-center
                        text-4xl
                        font-bold
                        text-zinc-800
                    "
                >
                    {renderQuestion()}
                </div>
                
                {/* ========================================= */}
                {/* DISPLAY */}
                {/* ========================================= */}

                <div className="ml-7 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-5 min-w-100">
                    <div className="min-h-13 break-all text-right font-mono text-4xl font-bold text-zinc-800">
                        {input || "0"}
                    </div>
                </div>
            </div>



            {/* ========================================= */}
            {/* KEYPAD */}
            {/* ========================================= */}

            <div className="grid grid-cols-4 gap-4">
                {buttons.map((btn, i) => (
                    <button
                        key={i}
                        disabled={isLocked}
                        onClick={() =>
                            btn === "="
                                ? calculate()
                                : handleClick(
                                    btn
                                )
                        }
                        className={`
                            h-20
                            rounded-3xl
                            text-3xl
                            font-bold
                            transition-all
                            active:scale-95
                            ${btn === "="
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                            }
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        `}
                    >
                        {displaySymbol(btn)}
                    </button>
                ))}
            </div>

            {/* ========================================= */}
            {/* ACTIONS */}
            {/* ========================================= */}

            <div className="mt-6 flex flex-wrap justify-center gap-4">
                {/* CLEAR */}
                <button
                    onClick={clear}
                    disabled={isLocked}
                    className="
                        flex items-center gap-2
                        rounded-2xl
                        bg-red-100
                        px-5 py-3
                        font-semibold
                        text-red-700
                        transition
                        hover:bg-red-200
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    <RotateCcw size={20} />

                    Clear
                </button>

                {/* BACKSPACE */}
                <button
                    onClick={backspace}
                    disabled={isLocked}
                    className="
                        flex items-center gap-2
                        rounded-2xl
                        bg-zinc-200
                        px-5 py-3
                        font-semibold
                        text-zinc-700
                        transition
                        hover:bg-zinc-300
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    <Delete size={20} />

                    Backspace
                </button>

                {/* CONFIRM */}
                {result !== null && (
                    <button
                        onClick={
                            confirmAnswer
                        }
                        disabled={isLocked}
                        className="
                            flex items-center gap-2
                            rounded-2xl
                            bg-green-600
                            px-5 py-3
                            font-semibold
                            text-white
                            transition
                            hover:bg-green-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <Check size={20} />

                        Confirm Answer
                    </button>
                )}
            </div>
        </div>
    );
};
export default Calculation;
