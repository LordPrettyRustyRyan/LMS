import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { startAttempt, submitAttempt } from "../api/attempts";
import { getAssignment } from "../api/assignments";
import { getResponses, saveResponse } from "../api/responses";

import ThreeOptionMCQ from "../components/questions/ThreeOptionMCQ";
import YesNo from "../components/questions/YesNo";
import QnAHandwriting from "../components/questions/QnAHandwriting";
import QnASpeech from "../components/questions/QnASpeech";
import Match from "../components/questions/Match";
import TextReading from "../components/questions/TextReading";
import Calculation from "../components/questions/Calculation";
import Recognition from "../components/questions/Recognition";
import Blending from "../components/questions/Blending";
import Comprehension from "../components/questions/Comprehension";
import Camera from "../components/questions/Camera";
import PictureSpeech from "../components/questions/PictureSpeech";

const AssignmentPlayer = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);

    const isLocked = attempt?.status === "submitted";

    // ---------------- INIT ----------------

    useEffect(() => {
        if (!assignmentId) return;
        init();
    }, [assignmentId]);

    const init = async () => {
        try {
            setLoading(true);

            const attemptRes = await startAttempt(assignmentId);
            setAttempt(attemptRes);

            const assignmentRes = await getAssignment(assignmentId);
            setAssignment(assignmentRes);

            const saved = (await getResponses(attemptRes._id)) || [];

            const map = {};

            saved.forEach((r) => {
                map[r.sub_question_id] = r.answer;
            });

            setResponses(map);

        } catch (err) {
            console.error(err);
            alert("Error loading assignment");
        } finally {
            setLoading(false);
        }
    };

    // ---------------- SAVE ANSWER ----------------

    const handleAnswer = async (
        questionId,
        subQuestionId,
        answer
    ) => {
        if (isLocked) return;

        const key = `${questionId}_${subQuestionId}`;

        try {
            // optimistic UI update
            setResponses((prev) => ({
                ...prev,
                [key]: answer,
            }));

            await saveResponse({
                attempt_id: attempt._id,
                question_id: questionId,
                sub_question_id: key,
                answer,
            });

            // progress update
            setAttempt((prev) => {
                if (!prev) return prev;

                const answeredSet = new Set([
                    ...Object.keys(responses),
                    key,
                ]);

                return {
                    ...prev,
                    progress: {
                        ...prev.progress,
                        answered_count: answeredSet.size,
                    },
                };
            });

        } catch (err) {
            console.error(err);
            alert("Failed to save response");
        }
    };

    // ---------------- SUBMIT ----------------

    const handleSubmit = async () => {
        try {
            await submitAttempt(attempt._id);

            alert("Assignment submitted");

            navigate(
                `/classes/${assignment.classroom_id}`,
                {
                    state: { view: "submissions" },
                }
            );

        } catch (err) {
            console.error(err);
            alert("Submit failed");
        }
    };

    // ---------------- RENDER QUESTION ----------------

    const renderQuestion = (q, subQuestion) => {
        const key = `${q.question_id}_${subQuestion.id}`;

        const commonProps = {
            question: q,
            subQuestion,
            response: responses[key],
            onAnswer: (answer) =>
                handleAnswer(
                    q.question_id,
                    subQuestion.id,
                    answer
                ),
            attempt,
            isLocked,
        };

        switch (q.type) {
            case "mcq_3":
                return <ThreeOptionMCQ {...commonProps} />;

            case "yes_no":
                return <YesNo {...commonProps} />;

            case "qnahandwriting":
                return <QnAHandwriting {...commonProps} />;

            case "qnaspeech":
                return <QnASpeech {...commonProps} />;

            case "match":
                return <Match {...commonProps} />;

            case "text_reading":
                return <TextReading {...commonProps} />;

            case "calculation":
                return <Calculation {...commonProps} />;

            case "recognition":
                return <Recognition {...commonProps} />;

            case "blending":
                return <Blending {...commonProps} />;

            case "comprehension":
                return <Comprehension {...commonProps} />;

            case "camera":
                return <Camera {...commonProps} />;

            case "picture":
                return <PictureSpeech {...commonProps} />;

            default:
                return (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-600">
                        Unsupported question type: {q.type}
                    </div>
                );
        }
    };

    // ---------------- LOADING ----------------

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600 mx-auto mb-4"></div>

                    <p className="text-slate-600 text-lg">
                        Loading assignment...
                    </p>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-600 text-lg">
                    No assignment found
                </p>
            </div>
        );
    }

    // ---------------- PROGRESS ----------------

    const progressPercent =
        attempt?.progress?.total_questions > 0
            ? (
                attempt.progress.answered_count /
                attempt.progress.total_questions
            ) * 100
            : 0;

    // ---------------- UI ----------------

    return (
        <div className="min-h-screen bg-slate-50">
            {/* HEADER */}
            <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="mx-auto max-w-5xl px-6 py-4">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* LEFT SIDE */}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="truncate text-2xl font-bold text-slate-900">
                                    {assignment.title}
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Complete all questions carefully
                                </p>

                                {isLocked && (
                                    <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                        Submitted
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* RIGHT SIDE */}
                        <div className="w-full lg:w-180">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-700">
                                    Progress
                                </span>

                                <span className="text-slate-500">
                                    {attempt?.progress?.answered_count}/
                                    {attempt?.progress?.total_questions}
                                </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                                    style={{
                                        width: `${progressPercent}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUESTIONS */}
            <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
                {assignment.questions.map((q, qIndex) => (
                    <div
                        key={qIndex}
                        className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
                    >
                        {/* QUESTION HEADER */}
                        <div className="mb-8">
                            <div className="mb-3 inline-flex items-center rounded-full bg-indigo-100 px-4 py-1 text-sm font-semibold text-indigo-700">
                                Question {qIndex + 1}
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900">
                                {q.question_title}
                            </h2>

                            {q.instruction && (
                                <p className="mt-3 text-slate-600">
                                    {q.instruction}
                                </p>
                            )}
                        </div>

                        {/* SUB QUESTIONS */}
                        <div className="space-y-8">
                            {q.sub_questions.map((sq, sqIndex) => (
                                <div key={sq.id}>
                                    {/* SUB QUESTION */}
                                    <div className="rounded-2xl bg-slate-50 p-5 md:p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                                                {sqIndex + 1}
                                            </div>

                                            <span className="text-sm font-medium text-slate-500">
                                                Sub Question
                                            </span>
                                        </div>

                                        {renderQuestion(q, sq)}
                                    </div>

                                    {/* LIGHT DIVIDER AFTER EVERY SUB QUESTION */}
                                    {sqIndex !==
                                        q.sub_questions.length -
                                        1 && (
                                            <div className="my-8 border-t border-slate-200" />
                                        )}
                                </div>
                            ))}
                        </div>

                        {/* DARK DIVIDER AFTER EVERY QUESTION */}
                        {qIndex !==
                            assignment.questions.length -
                            1 && (
                                <div className="mt-10 border-t-4 border-slate-300" />
                            )}
                    </div>
                ))}

                {/* SUBMIT BUTTON */}
                <div className="mt-10 flex justify-end">
                    <button
                        disabled={isLocked}
                        onClick={handleSubmit}
                        className={`rounded-2xl px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-200 ${isLocked
                            ? "cursor-not-allowed bg-slate-300 text-slate-500"
                            : "bg-indigo-600 text-white hover:-translate-y-0.5 hover:bg-indigo-700"
                            }`}
                    >
                        {isLocked
                            ? "Assignment Submitted"
                            : "Submit Assignment"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentPlayer;
