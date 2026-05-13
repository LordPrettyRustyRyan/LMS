import { useState, useRef, useEffect } from "react";

const Match = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    const [selectedLeft, setSelectedLeft] =
        useState(null);

    const connections =
        response?.connections || [];

    const containerRef = useRef(null);

    const [linePositions, setLinePositions] =
        useState([]);

    // ---------------------------------------------------
    // HANDLE CONNECTIONS
    // ---------------------------------------------------

    const handleLeftClick = (leftId) => {
        if (isLocked) return;

        setSelectedLeft(leftId);
    };

    const handleRightClick = (rightId) => {
        if (isLocked || !selectedLeft) return;

        let updated = [...connections];

        // remove existing left connection
        updated = updated.filter(
            (c) => c.left_id !== selectedLeft
        );

        // one right item only once
        updated = updated.filter(
            (c) => c.right_id !== rightId
        );

        updated.push({
            left_id: selectedLeft,
            right_id: rightId,
        });

        setSelectedLeft(null);

        onAnswer({
            connections: updated,
        });
    };

    // ---------------------------------------------------
    // CALCULATE LINE POSITIONS
    // ---------------------------------------------------

    useEffect(() => {
        const updateLines = () => {
            if (!containerRef.current) return;

            const containerRect =
                containerRef.current.getBoundingClientRect();

            const positions = connections
                .map((connection) => {
                    const leftEl =
                        document.getElementById(
                            `left-${connection.left_id}`
                        );

                    const rightEl =
                        document.getElementById(
                            `right-${connection.right_id}`
                        );

                    if (!leftEl || !rightEl)
                        return null;

                    const leftRect =
                        leftEl.getBoundingClientRect();

                    const rightRect =
                        rightEl.getBoundingClientRect();

                    return {
                        x1:
                            leftRect.left -
                            containerRect.left +
                            leftRect.width / 2,

                        y1:
                            leftRect.bottom -
                            containerRect.top,

                        x2:
                            rightRect.left -
                            containerRect.left +
                            rightRect.width / 2,

                        y2:
                            rightRect.top -
                            containerRect.top,
                    };
                })
                .filter(Boolean);

            setLinePositions(positions);
        };

        updateLines();

        window.addEventListener(
            "resize",
            updateLines
        );

        return () => {
            window.removeEventListener(
                "resize",
                updateLines
            );
        };
    }, [connections]);

    // ---------------------------------------------------
    // HELPERS
    // ---------------------------------------------------

    const isConnected = (leftId) => {
        return connections.some(
            (c) => c.left_id === leftId
        );
    };

    // ---------------------------------------------------
    // RENDER CONTENT
    // ---------------------------------------------------

    const renderItemContent = (content) => {
        return content.map((c, i) => {
            if (c.type === "image") {
                return (
                    <img
                        key={i}
                        src={c.value}
                        alt=""
                        className="max-h-28 rounded-xl object-contain"
                    />
                );
            }

            return (
                <p
                    key={i}
                    className="text-lg font-medium text-zinc-700"
                >
                    {c.value}
                </p>
            );
        });
    };

    // ---------------------------------------------------
    // UI
    // ---------------------------------------------------

    return (
        <div
            ref={containerRef}
            className="relative rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
            {/* ============================================= */}
            {/* SVG CONNECTION LINES */}
            {/* ============================================= */}

            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                {linePositions.map((line, i) => (
                    <line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#4f46e5"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                ))}
            </svg>

            {/* ============================================= */}
            {/* TOP ROW */}
            {/* ============================================= */}

            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                {subQuestion.left_items.map(
                    (item) => (
                        <button
                            key={item.id}
                            id={`left-${item.id}`}
                            onClick={() =>
                                handleLeftClick(
                                    item.id
                                )
                            }
                            disabled={isLocked}
                            className={`
                                relative z-10 flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-white p-4 transition-all

                                ${
                                    selectedLeft ===
                                    item.id
                                        ? "border-indigo-600 ring-4 ring-indigo-100"
                                        : isConnected(
                                              item.id
                                          )
                                        ? "border-green-500"
                                        : "border-zinc-200"
                                }

                                ${
                                    !isLocked
                                        ? "hover:border-indigo-400"
                                        : ""
                                }

                                disabled:cursor-not-allowed
                            `}
                        >
                            {renderItemContent(
                                item.content
                            )}
                        </button>
                    )
                )}
            </div>

            {/* ============================================= */}
            {/* CENTER SPACE */}
            {/* ============================================= */}

            <div className="h-32" />

            {/* ============================================= */}
            {/* BOTTOM ROW */}
            {/* ============================================= */}

            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                {subQuestion.right_items.map(
                    (item) => (
                        <button
                            key={item.id}
                            id={`right-${item.id}`}
                            onClick={() =>
                                handleRightClick(
                                    item.id
                                )
                            }
                            disabled={
                                isLocked ||
                                !selectedLeft
                            }
                            className={`
                                relative z-10 flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-zinc-50 p-4 transition-all

                                ${
                                    selectedLeft
                                        ? "border-indigo-300 hover:border-indigo-500"
                                        : "border-zinc-200"
                                }

                                disabled:cursor-not-allowed
                            `}
                        >
                            {renderItemContent(
                                item.content
                            )}
                        </button>
                    )
                )}
            </div>

            {/* ============================================= */}
            {/* INSTRUCTION */}
            {/* ============================================= */}

            {!isLocked && (
                <div className="mt-8 text-center text-sm text-zinc-500">
                    Tap a top item, then tap its
                    matching bottom item
                </div>
            )}
        </div>
    );
};

export default Match;