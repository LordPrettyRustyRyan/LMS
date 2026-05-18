import { useState, useRef, useEffect, useMemo } from "react";

const Match = ({
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    // ===================================================
    // STATE
    // ===================================================

    const [selectedLeft, setSelectedLeft] =
        useState(null);

    const [linePositions, setLinePositions] =
        useState([]);

    const containerRef = useRef(null);

    // ===================================================
    // UNIQUE INSTANCE PREFIX
    // VERY IMPORTANT:
    // prevents duplicate DOM ids across multiple
    // Match components rendered on same page
    // ===================================================

    const instanceId = useMemo(() => {
        return `match-${subQuestion?.id}-${Math.random()
            .toString(36)
            .slice(2, 9)}`;
    }, [subQuestion?.id]);

    // ===================================================
    // CONNECTIONS
    // ===================================================

    const connections =
        response?.connections || [];

    // ===================================================
    // HANDLE LEFT CLICK
    // ===================================================

    const handleLeftClick = (leftId) => {
        if (isLocked) return;

        setSelectedLeft(leftId);
    };

    // ===================================================
    // HANDLE RIGHT CLICK
    // ===================================================

    const handleRightClick = (rightId) => {
        if (isLocked || !selectedLeft) return;

        let updated = [...connections];

        // remove old left connection
        updated = updated.filter(
            (c) => c.left_id !== selectedLeft
        );

        // only one right item once
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

    // ===================================================
    // UPDATE LINES
    // ===================================================

    useEffect(() => {
        const updateLines = () => {
            if (!containerRef.current) return;

            const containerRect =
                containerRef.current.getBoundingClientRect();

            const positions = connections
                .map((connection) => {
                    const leftEl =
                        document.getElementById(
                            `${instanceId}-left-${connection.left_id}`
                        );

                    const rightEl =
                        document.getElementById(
                            `${instanceId}-right-${connection.right_id}`
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

        // initial render
        const timeout = setTimeout(
            updateLines,
            50
        );

        // resize listener
        window.addEventListener(
            "resize",
            updateLines
        );

        return () => {
            clearTimeout(timeout);

            window.removeEventListener(
                "resize",
                updateLines
            );
        };
    }, [connections, instanceId]);

    // ===================================================
    // HELPERS
    // ===================================================

    const isConnected = (leftId) => {
        return connections.some(
            (c) => c.left_id === leftId
        );
    };

    // ===================================================
    // CONTENT RENDERER
    // ===================================================

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
                    className="text-lg font-semibold text-zinc-700"
                >
                    {c.value}
                </p>
            );
        });
    };

    // ===================================================
    // UI
    // ===================================================

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
            {/* ========================================== */}
            {/* SVG LINES */}
            {/* ========================================== */}

            <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full">
                {linePositions.map((line, i) => (
                    <line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#4f46e5"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                ))}
            </svg>

            {/* ========================================== */}
            {/* TOP ROW */}
            {/* ========================================== */}

            <div className="relative z-10 grid grid-cols-2 gap-6 md:grid-cols-5">
                {subQuestion.left_items.map(
                    (item) => (
                        <button
                            key={item.id}
                            id={`${instanceId}-left-${item.id}`}
                            onClick={() =>
                                handleLeftClick(
                                    item.id
                                )
                            }
                            disabled={isLocked}
                            className={`
                                flex min-h-35 flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-white p-4 transition-all

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

            {/* ========================================== */}
            {/* CONNECTOR SPACE */}
            {/* ========================================== */}

            <div className="h-32" />

            {/* ========================================== */}
            {/* BOTTOM ROW */}
            {/* ========================================== */}

            <div className="relative z-10 grid grid-cols-2 gap-6 md:grid-cols-5">
                {subQuestion.right_items.map(
                    (item) => (
                        <button
                            key={item.id}
                            id={`${instanceId}-right-${item.id}`}
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
                                flex min-h-35 flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-zinc-50 p-4 transition-all

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

            {/* ========================================== */}
            {/* INSTRUCTION */}
            {/* ========================================== */}

            {!isLocked && (
                <div className="mt-8 text-center text-sm font-medium text-zinc-500">
                    Select an item from the top row,
                    then select its matching item
                    below
                </div>
            )}
        </div>
    );
};

export default Match;
