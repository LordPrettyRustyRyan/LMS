import { useEffect, useRef, useState } from "react";
import { uploadMedia } from "../../api/media";

const QnAHandwriting = ({
    question,
    subQuestion,
    response,
    onAnswer,
    isLocked,
}) => {
    const canvasRef = useRef(null);

    const [drawing, setDrawing] = useState(false);

    const [saving, setSaving] = useState(false);

    // local preview
    const [savedImage, setSavedImage] = useState("");

    // ---------------- LOAD SAVED RESPONSE ----------------

    useEffect(() => {
        if (response?.image_url) {
            setSavedImage(response.image_url);
        }
    }, [response]);

    // ---------------- CANVAS SETUP ----------------

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        // white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111827";
    }, []);

    // ---------------- HELPERS ----------------

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // TOUCH
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }

        // MOUSE
        return {
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
        };
    };

    // ---------------- DRAW START ----------------

    const startDrawing = (e) => {
        if (isLocked) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const { x, y } = getCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(x, y);

        setDrawing(true);
    };

    // ---------------- DRAW ----------------

    const draw = (e) => {
        if (!drawing || isLocked) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const { x, y } = getCoordinates(e);

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    // ---------------- STOP DRAW ----------------

    const stopDrawing = () => {
        setDrawing(false);
    };

    // ---------------- CLEAR / RETRY ----------------

    const clearCanvas = () => {
        if (isLocked) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // restore white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();

        setSavedImage("");
    };

    // ---------------- SAVE ----------------

    const handleSave = async () => {
        if (isLocked) return;

        try {
            setSaving(true);

            const canvas = canvasRef.current;

            // convert canvas -> blob
            const blob = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png")
            );

            if (!blob) {
                alert("Failed to generate image");
                return;
            }

            // create file
            const file = new File(
                [blob],
                `handwriting-${Date.now()}.png`,
                {
                    type: "image/png",
                }
            );

            // upload to cloudinary
            const uploadRes = await uploadMedia(file, "handwriting_answers");

            const imageUrl = uploadRes?.data?.url;

            if (!imageUrl) {
                throw new Error("Upload failed");
            }

            // local preview
            setSavedImage(imageUrl);

            // save response
            await onAnswer({
                image_url: imageUrl,
                recognized_text: "",
            });

        } catch (err) {
            console.error(err);
            alert("Failed to save answer");
        } finally {
            setSaving(false);
        }
    };

    // ---------------- RENDER CONTENT ----------------

    const renderContent = () => {
        return subQuestion?.content?.map((c, i) => {
            if (c.type === "text") {
                return (
                    <p
                        key={i}
                        className="text-lg font-medium text-slate-800"
                    >
                        {c.value}
                    </p>
                );
            }

            if (c.type === "image") {
                return (
                    <img
                        key={i}
                        src={c.value}
                        alt=""
                        className="mt-3 w-40 rounded-xl border border-slate-200"
                    />
                );
            }

            if (c.type === "audio") {
                return (
                    <audio
                        key={i}
                        controls
                        className="mt-3"
                    >
                        <source src={c.value} />
                    </audio>
                );
            }

            return null;
        });
    };

    // ---------------- UI ----------------

    return (
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            
            {/* QUESTION */}
            <div className="space-y-3">
                {renderContent()}
            </div>

            {/* CANVAS AREA */}
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
                
                <canvas
                    ref={canvasRef}
                    width={900}
                    height={320}
                    className={`
                        w-full rounded-2xl border-2 border-dashed
                        border-slate-300 bg-white touch-none
                        ${isLocked ? "opacity-70" : ""}
                    `}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}

                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-3">
                
                <button
                    disabled={isLocked || saving}
                    onClick={handleSave}
                    className={`
                        rounded-2xl px-6 py-3 text-sm font-semibold
                        transition-all duration-200
                        ${
                            isLocked || saving
                                ? "cursor-not-allowed bg-slate-300 text-slate-500"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }
                    `}
                >
                    {saving ? "Saving..." : "Save Answer"}
                </button>

                <button
                    disabled={isLocked || saving}
                    onClick={clearCanvas}
                    className={`
                        rounded-2xl border px-6 py-3 text-sm font-semibold
                        transition-all duration-200
                        ${
                            isLocked || saving
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        }
                    `}
                >
                    Retry
                </button>
            </div>

            {/* SAVED PREVIEW */}
            {savedImage && (
                <div className="max-w-[340px] space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>

                        <p className="font-semibold text-emerald-700">
                            Saved Answer Preview
                        </p>
                    </div>

                    <img
                        src={savedImage}
                        alt="Saved handwriting answer"
                        className="rounded-2xl border border-emerald-200 bg-white object-contain"
                    />
                </div>
            )}
        </div>
    );
};

export default QnAHandwriting;