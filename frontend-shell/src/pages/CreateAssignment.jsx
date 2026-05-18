import { useEffect, useMemo, useState } from "react";

import { createAssignment } from "../api/assignments";
import { getMyClasses } from "../api/classrooms";
import { getQuestions } from "../api/questions";

import { useParams, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";

import {
    Plus,
    Trash2,
    Layers3,
    ListChecks,
    Sparkles,
} from "lucide-react";

const CreateAssignment = () => {
    const navigate = useNavigate();

    const { id } = useParams();

    const { user } = useAuth();

    // ---------------- STATE ----------------

    const [title, setTitle] = useState("");

    const [classrooms, setClassrooms] =
        useState([]);

    const [classroomId, setClassroomId] =
        useState("");

    const [dueDate, setDueDate] =
        useState("");

    const [questionsList, setQuestionsList] =
        useState([]);

    const [category, setCategory] =
        useState("");

    const [type, setType] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [questions, setQuestions] =
        useState([
            {
                question_id: "",
                sub_questions: [],
                marks_per_sub: 1,
            },
        ]);

    // ---------------- FETCH ----------------

    useEffect(() => {
        fetchClassrooms();
    }, []);

    useEffect(() => {
        fetchQuestions();

        if (id) {
            setClassroomId(id);
        }
    }, [id, category, type]);

    const fetchClassrooms = async () => {
        try {
            const res = await getMyClasses();

            setClassrooms(res || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQuestions = async () => {
        try {
            // IMPORTANT:
            // backend expects qtype NOT type

            const res = await getQuestions({
                category,
                qtype: type,
            });

            setQuestionsList(res || []);
        } catch (err) {
            console.error(err);
        }
    };

    // ---------------- HELPERS ----------------

    const getSelectedQuestion = (id) => {
        return questionsList.find(
            (q) => q._id === id
        );
    };

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                question_id: "",
                sub_questions: [],
                marks_per_sub: 1,
            },
        ]);
    };

    const handleRemoveQuestion = (index) => {
        const updated = [...questions];

        updated.splice(index, 1);

        setQuestions(updated);
    };

    const handleChange = (
        index,
        field,
        value
    ) => {
        const updated = [...questions];

        updated[index][field] = value;

        setQuestions(updated);
    };

    const toggleSubQuestion = (
        qIndex,
        subId,
        checked
    ) => {
        const updated = [...questions];

        if (checked) {
            if (
                !updated[qIndex].sub_questions.includes(
                    subId
                )
            ) {
                updated[
                    qIndex
                ].sub_questions.push(subId);
            }
        } else {
            updated[qIndex].sub_questions =
                updated[
                    qIndex
                ].sub_questions.filter(
                    (s) => s !== subId
                );
        }

        setQuestions(updated);
    };

    const applyPresetSelection = (
        qIndex,
        mode
    ) => {
        const selectedQuestion =
            getSelectedQuestion(
                questions[qIndex].question_id
            );

        if (!selectedQuestion) return;

        const allSubIds =
            selectedQuestion.sub_questions.map(
                (s) => s.id
            );

        let selected = [];

        switch (mode) {
            case "first5":
                selected = allSubIds.slice(0, 5);
                break;

            case "last5":
                selected = allSubIds.slice(-5);
                break;

            case "first10":
                selected = allSubIds.slice(0, 10);
                break;

            case "odd":
                selected = allSubIds.filter(
                    (_, i) => i % 2 === 0
                );
                break;

            case "even":
                selected = allSubIds.filter(
                    (_, i) => i % 2 === 1
                );
                break;

            case "all":
                selected = allSubIds;
                break;

            case "clear":
                selected = [];
                break;

            default:
                selected = [];
        }

        const updated = [...questions];

        updated[qIndex].sub_questions =
            selected;

        setQuestions(updated);
    };

    // ---------------- SUBMIT ----------------

    const handleSubmit = async () => {
        if (
            !title ||
            !classroomId ||
            !dueDate
        ) {
            alert("Fill all required fields");
            return;
        }

        // VALIDATION

        for (let q of questions) {
            if (!q.question_id) {
                alert("Select a question");
                return;
            }

            if (
                !q.sub_questions ||
                q.sub_questions.length === 0
            ) {
                alert(
                    "Each question must have sub-questions"
                );
                return;
            }
        }

        const payload = {
            title,
            classroom_id: classroomId,
            due_date:
                new Date(
                    dueDate
                ).toISOString(),
            questions,
        };

        try {
            setLoading(true);

            await createAssignment(payload);

            alert("Assignment created");

            navigate(
                `/classes/${classroomId}`,
                {
                    state: {
                        view: "assignments",
                    },
                }
            );
        } catch (err) {
            console.error(err);

            alert(
                err?.response?.data
                    ?.message ||
                "Error creating assignment"
            );
        } finally {
            setLoading(false);
        }
    };

    const totalSelectedSubQuestions =
        useMemo(() => {
            return questions.reduce(
                (acc, q) =>
                    acc +
                    q.sub_questions.length,
                0
            );
        }, [questions]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar role={user?.role} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

                {/* HERO */}

                <div className="rounded-3xl bg-linear-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-lg md:p-10">
                    <p className="mb-2 text-sm uppercase tracking-wider text-indigo-100">
                        Assignment Builder
                    </p>

                    <h1 className="text-4xl font-bold">
                        Create Assignment
                    </h1>

                    <p className="mt-3 max-w-2xl text-indigo-100">
                        Build assignments,
                        choose questions,
                        assign marks, and
                        publish learning
                        activities for your
                        classroom.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
                    <h2 className="mb-6 text-2xl font-bold text-slate-900">
                        Assignment Details
                    </h2>

                    {/* Changed to a responsive grid layout */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                        {/* TITLE */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Assignment Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter assignment title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            />
                        </div>

                        {/* CLASSROOM */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Classroom
                            </label>
                            <select
                                value={classroomId}
                                disabled={!!id}
                                onChange={(e) => setClassroomId(e.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                            >
                                <option value="">Select Classroom</option>
                                {classrooms.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* DUE DATE */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Due Date
                            </label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            />
                        </div>
                    </div>
                </div>

                {/* MAIN */}

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">

                    {/* QUESTIONS LEFT SIDE */}

                    <div className="space-y-6 lg:col-span-8">

                        {/* QUESTIONS */}

                        {questions.map(
                            (
                                q,
                                index
                            ) => {
                                const selectedQuestion =
                                    getSelectedQuestion(
                                        q.question_id
                                    );

                                const subQuestions =
                                    selectedQuestion?.sub_questions ||
                                    [];

                                const isLargeGrid =
                                    subQuestions.length >
                                    10;

                                return (
                                    <div
                                        key={
                                            index
                                        }
                                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >

                                        {/* TOP */}

                                        <div className="mb-6 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                                                    <Layers3 size={24} />
                                                </div>

                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-900">
                                                        Question{" "}
                                                        {index +
                                                            1}
                                                    </h2>

                                                    <p className="text-sm text-slate-500">
                                                        Configure
                                                        question
                                                        selection
                                                    </p>
                                                </div>
                                            </div>

                                            {questions.length >
                                                1 && (
                                                    <button
                                                        onClick={() =>
                                                            handleRemoveQuestion(
                                                                index
                                                            )
                                                        }
                                                        className="flex items-center gap-2 rounded-2xl bg-rose-100 px-4 py-2 font-semibold text-rose-700 transition hover:bg-rose-200"
                                                    >
                                                        <Trash2 size={18} />
                                                        Delete
                                                    </button>
                                                )}
                                        </div>

                                        {/* SELECT QUESTION */}

                                        <div className="mb-6">
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                Select
                                                Question
                                            </label>

                                            <select
                                                value={
                                                    q.question_id
                                                }
                                                disabled={
                                                    !category
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleChange(
                                                        index,
                                                        "question_id",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                                            >
                                                <option value="">
                                                    Select
                                                    Question
                                                </option>

                                                {questionsList.map(
                                                    (
                                                        question
                                                    ) => (
                                                        <option
                                                            key={
                                                                question._id
                                                            }
                                                            value={
                                                                question._id
                                                            }
                                                        >
                                                            {
                                                                question.question_title
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        {/* SUB QUESTIONS */}

                                        {q.question_id && (
                                            <div className="mb-6">

                                                {/* HEADER */}

                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                    <label className="text-sm font-semibold text-slate-700">
                                                        Select
                                                        Sub
                                                        Questions
                                                    </label>

                                                    <div className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                                                        {
                                                            q
                                                                .sub_questions
                                                                .length
                                                        }{" "}
                                                        Selected
                                                    </div>
                                                </div>

                                                {/* PRESET BUTTONS */}

                                                <div className="mb-5 flex flex-wrap gap-2">
                                                    {[
                                                        {
                                                            label:
                                                                "First 5",
                                                            value:
                                                                "first5",
                                                        },
                                                        {
                                                            label:
                                                                "Last 5",
                                                            value:
                                                                "last5",
                                                        },
                                                        {
                                                            label:
                                                                "First 10",
                                                            value:
                                                                "first10",
                                                        },
                                                        {
                                                            label:
                                                                "Alt Odd",
                                                            value:
                                                                "odd",
                                                        },
                                                        {
                                                            label:
                                                                "Alt Even",
                                                            value:
                                                                "even",
                                                        },
                                                        {
                                                            label:
                                                                "Select All",
                                                            value:
                                                                "all",
                                                        },
                                                        {
                                                            label:
                                                                "Clear",
                                                            value:
                                                                "clear",
                                                        },
                                                    ].map(
                                                        (
                                                            preset
                                                        ) => (
                                                            <button
                                                                key={
                                                                    preset.value
                                                                }
                                                                onClick={() =>
                                                                    applyPresetSelection(
                                                                        index,
                                                                        preset.value
                                                                    )
                                                                }
                                                                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                                            >
                                                                {
                                                                    preset.label
                                                                }
                                                            </button>
                                                        )
                                                    )}
                                                </div>

                                                {/* SUB QUESTIONS GRID */}

                                                <div
                                                    className={`grid gap-4 ${isLargeGrid
                                                            ? "grid-cols-1 md:grid-cols-3"
                                                            : "grid-cols-1 md:grid-cols-2"
                                                        }`}
                                                >
                                                    {subQuestions.map(
                                                        (
                                                            sub
                                                        ) => {
                                                            const getDisplayText =
                                                                () => {
                                                                    // 1. Highest priority → display_text (NEW STANDARD)

                                                                    if (
                                                                        sub.display_text
                                                                    )
                                                                        return sub.display_text;

                                                                    // 2. fallback → first text content

                                                                    if (
                                                                        sub.content
                                                                            ?.length
                                                                    ) {
                                                                        const textItem =
                                                                            sub.content.find(
                                                                                (
                                                                                    c
                                                                                ) =>
                                                                                    c.type ===
                                                                                    "text"
                                                                            );

                                                                        if (
                                                                            textItem
                                                                        )
                                                                            return textItem.value;
                                                                    }

                                                                    // 3. comprehension / nested cases

                                                                    if (
                                                                        sub.questions
                                                                            ?.length
                                                                    ) {
                                                                        return (
                                                                            sub
                                                                                .questions[0]
                                                                                ?.text ||
                                                                            sub.id
                                                                        );
                                                                    }

                                                                    // 4. last fallback

                                                                    return sub.id;
                                                                };

                                                            const checked =
                                                                q.sub_questions.includes(
                                                                    sub.id
                                                                );

                                                            return (
                                                                <label
                                                                    key={
                                                                        sub.id
                                                                    }
                                                                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${checked
                                                                            ? "border-indigo-400 bg-indigo-50"
                                                                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                checked
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                toggleSubQuestion(
                                                                                    index,
                                                                                    sub.id,
                                                                                    e
                                                                                        .target
                                                                                        .checked
                                                                                )
                                                                            }
                                                                            className="mt-1 h-5 w-5 accent-indigo-600"
                                                                        />

                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="line-clamp-3 font-medium text-slate-800">
                                                                                {getDisplayText()}
                                                                            </p>

                                                                            <p className="mt-2 text-xs text-slate-500">
                                                                                ID:{" "}
                                                                                {
                                                                                    sub.id
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* MARKS */}

                                        <div>
                                            <div className="mb-3 flex items-center justify-between">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    Marks
                                                    Per Sub
                                                    Question
                                                </label>

                                                <div className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
                                                    {
                                                        q.marks_per_sub
                                                    }
                                                </div>
                                            </div>

                                            <input
                                                type="range"
                                                min="0"
                                                max="5"
                                                step="1"
                                                value={
                                                    q.marks_per_sub
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleChange(
                                                        index,
                                                        "marks_per_sub",
                                                        Number(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    )
                                                }
                                                className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
                                            />

                                            <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                                                <span>
                                                    0
                                                </span>
                                                <span>
                                                    5
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}

                        {/* ADD QUESTION */}

                        <button
                            onClick={
                                handleAddQuestion
                            }
                            className="flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-white py-6 text-lg font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            <Plus size={22} />
                            Add Another
                            Question
                        </button>
                    </div>

                    {/* RIGHT SIDEBAR */}

                    <div className="space-y-6 lg:col-span-4">

                        {/* ASSIGNMENT DETAILS */}

                        <div className="sticky top-24 space-y-6">



                            {/* QUESTION FILTERS */}

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                                        <Sparkles size={20} />
                                    </div>

                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Question
                                        Filters
                                    </h2>
                                </div>

                                <div className="space-y-5">

                                    {/* CATEGORY */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Category
                                        </label>

                                        <select
                                            value={
                                                category
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setCategory(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                        >
                                            <option value="">
                                                Select
                                                Category
                                            </option>

                                            <option value="reading">
                                                Reading
                                            </option>

                                            <option value="numeracy">
                                                Numeracy
                                            </option>

                                            <option value="communication">
                                                Communication
                                            </option>
                                        </select>
                                    </div>

                                    {/* TYPE */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Question
                                            Type
                                        </label>

                                        <select
                                            value={
                                                type
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setType(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                        >
                                            <option value="">
                                                All
                                                Types
                                            </option>

                                            <option value="mcq_3">
                                                3
                                                Option
                                                MCQ
                                            </option>

                                            <option value="yes_no">
                                                Yes /
                                                No
                                            </option>

                                            <option value="match">
                                                Match
                                            </option>

                                            <option value="text_reading">
                                                Text
                                                Reading
                                            </option>

                                            <option value="calculation">
                                                Calculations
                                            </option>

                                            <option value="comprehension">
                                                Comprehension
                                            </option>

                                            <option value="recognition">
                                                Recognition
                                            </option>

                                            <option value="blending">
                                                Blending
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SUMMARY */}

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                                        <ListChecks size={20} />
                                    </div>

                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Summary
                                    </h2>
                                </div>

                                <div className="space-y-5">

                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">
                                            Questions
                                        </span>

                                        <span className="font-bold text-slate-900">
                                            {
                                                questions.length
                                            }
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">
                                            Selected
                                            Subs
                                        </span>

                                        <span className="font-bold text-slate-900">
                                            {
                                                totalSelectedSubQuestions
                                            }
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">
                                            Classroom
                                        </span>

                                        <span className="text-right font-bold text-slate-900">
                                            {classrooms.find(
                                                (
                                                    c
                                                ) =>
                                                    c._id ===
                                                    classroomId
                                            )
                                                ?.name ||
                                                "-"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">
                                            Category
                                        </span>

                                        <span className="capitalize font-bold text-slate-900">
                                            {category ||
                                                "-"}
                                        </span>
                                    </div>

                                    <div className="border-t border-slate-200 pt-4">
                                        <button
                                            onClick={
                                                handleSubmit
                                            }
                                            disabled={
                                                loading
                                            }
                                            className="w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                                        >
                                            {loading
                                                ? "Creating..."
                                                : "Create Assignment"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* commented future sections */}

                {/* <div>Assignment Templates</div> */}

                {/* <div>Auto Question Generator</div> */}

                {/* <div>AI Difficulty Suggestions</div> */}
            </div>
        </div>
    );
};

export default CreateAssignment;
