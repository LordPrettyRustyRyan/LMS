import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

import Navbar from "../components/Navbar";

import {
    getTeacherResponses,
    getResponses,
    gradeResponse,
} from "../api/responses";

import { getAssignment } from "../api/assignments";

import {
    getAttempt,
    gradeAttempt,
} from "../api/attempts";

// QUESTION COMPONENTS
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

const AttemptDetail = () => {
    const { attemptId } = useParams();
    const { user } = useAuth();

    const [attempt, setAttempt] = useState(null);
    const [assignment, setAssignment] = useState(null);

    const [responses, setResponses] = useState({});
    const [responseMeta, setResponseMeta] = useState({});
    const [scores, setScores] = useState({});

    const [loading, setLoading] = useState(true);

    const isTeacher = user?.role === "teacher";

    // ---------------- INIT ----------------

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            setLoading(true);

            const attemptRes = await getAttempt(attemptId);

            const assignmentRes = await getAssignment(
                attemptRes.assignment_id
            );

            let res = [];

            if (isTeacher) {
                res = await getTeacherResponses(attemptId);
            } else {
                res = await getResponses(attemptId);
            }

            // ---------------- BUILD MAPS ----------------

            const answerMap = {};
            const metaMap = {};
            const scoreMap = {};

            res.forEach((r) => {
                answerMap[r.sub_question_id] = r.answer;
                metaMap[r.sub_question_id] = r;

                if (r.score !== undefined) {
                    scoreMap[r._id] = r.score;
                }
            });

            setResponses(answerMap);
            setResponseMeta(metaMap);
            setScores(scoreMap);

            setAttempt(attemptRes);
            setAssignment(assignmentRes);

        } catch (err) {
            console.error(err);
            alert("Failed to load attempt");
        } finally {
            setLoading(false);
        }
    };

    // ---------------- GRADING ----------------

    const canGrade =
        isTeacher &&
        attempt?.status === "submitted";

    const handleGrade = async (responseId, score) => {
        if (!canGrade) return;

        try {
            setScores((prev) => ({
                ...prev,
                [responseId]: score,
            }));

            await gradeResponse(responseId, {
                score,
                feedback: "",
            });

        } catch (err) {
            console.error(err);
            alert("Failed to grade");
        }
    };

    const handleFinishGrading = async () => {
        try {
            await gradeAttempt(attempt._id);

            alert("Grading complete");

            init();

        } catch (err) {
            console.error(err);
            alert("Failed to finalize grading");
        }
    };

    // ---------------- QUESTION RENDER ----------------

    const renderQuestion = (q, sq) => {
        const key = `${q.question_id}_${sq.id}`;

        const commonProps = {
            question: q,
            subQuestion: sq,
            response: responses[key],
            isLocked: true,
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
            <div className="min-h-screen bg-slate-50">
                <Navbar role={user?.role} />

                <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center px-6">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700"></div>

                        <p className="text-lg font-medium text-slate-700">
                            Loading Attempt...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------- SCORE ----------------

    const currentScore = Object.values(scores).reduce(
        (a, b) => a + (b || 0),
        0
    );

    // ---------------- UI ----------------

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar role={user?.role} />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

                {/* HEADER */}

                <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
                                Attempt Review
                            </p>

                            <h1 className="text-3xl font-bold text-slate-900">
                                {assignment?.title || "Assignment"}
                            </h1>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                                    Status: {attempt?.status}
                                </div>

                                {attempt?.status === "graded" && (
                                    <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                                        Final Score: {attempt.score} / {attempt.max_score}
                                    </div>
                                )}

                                {canGrade && (
                                    <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                                        Current Score: {currentScore}
                                    </div>
                                )}
                            </div>
                        </div>

                        {canGrade && (
                            <button
                                onClick={handleFinishGrading}
                                className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Save Final Score
                            </button>
                        )}
                    </div>
                </div>

                {/* QUESTIONS */}

                <div className="space-y-8">
                    {assignment?.questions.map((q, qIndex) => (
                        <div
                            key={qIndex}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            {/* QUESTION HEADER */}

                            <div className="mb-6">
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
                                {q.sub_questions.map((sq, sqIndex) => {
                                    const key = `${q.question_id}_${sq.id}`;
                                    const meta = responseMeta[key];

                                    return (
                                        <div key={sq.id}>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                                                {/* SUB QUESTION TITLE */}

                                                <div className="mb-5 flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold text-slate-800">
                                                        Sub Question {sqIndex + 1}
                                                    </h3>

                                                    {meta?.score !== undefined && (
                                                        <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                                                            Score: {meta.score}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* QUESTION COMPONENT */}

                                                <div>
                                                    {renderQuestion(q, sq)}
                                                </div>

                                                {/* TEACHER GRADING */}

                                                {canGrade && meta && (
                                                    <div className="mt-6 border-t border-slate-200 pt-5">
                                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                                            {/* LABEL + SCORE */}

                                                            <div>
                                                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                                    Grade Response
                                                                </label>

                                                                <div className="flex items-center gap-3">
                                                                    <div className="rounded-full bg-indigo-100 px-4 py-1 text-sm font-bold text-indigo-700">
                                                                        {scores[meta._id] ?? 0} / 5
                                                                    </div>

                                                                    <div className="text-sm text-slate-500">
                                                                        Slide to assign marks
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* SLIDER */}

                                                            <div className="w-full sm:max-w-sm">
                                                                <input
                                                                    type="range"
                                                                    min="0"
                                                                    max="5"
                                                                    step="1"
                                                                    value={scores[meta._id] ?? 0}
                                                                    onChange={(e) =>
                                                                        handleGrade(
                                                                            meta._id,
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                    className="
                                                                        h-3 w-full cursor-pointer appearance-none rounded-full
                                                                        bg-slate-200 accent-indigo-600
                                                                    "
                                                                />

                                                                {/* SCALE */}

                                                                <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                                                                    <span>0</span>
                                                                    <span>1</span>
                                                                    <span>2</span>
                                                                    <span>3</span>
                                                                    <span>4</span>
                                                                    <span>5</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* SUB QUESTION DIVIDER */}

                                            {sqIndex !== q.sub_questions.length - 1 && (
                                                <hr className="mt-8 border-slate-300" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* QUESTION DIVIDER */}

                            {qIndex !== assignment.questions.length - 1 && (
                                <div className="mt-10 border-b-4 border-slate-400"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AttemptDetail;
