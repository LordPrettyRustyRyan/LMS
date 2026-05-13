import { useEffect, useState } from "react";

import { createAssignment } from "../api/assignments";
import { getMyClasses } from "../api/classrooms";
import { getQuestions } from "../api/questions";

import { useParams, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";

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
            const res = await getQuestions({
                category,
                type,
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

            if (
                !q.marks_per_sub ||
                q.marks_per_sub <= 0
            ) {
                alert(
                    "Marks must be greater than 0"
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

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar role={user?.role} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* HERO */}

                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white shadow-lg">
                    <p className="uppercase tracking-wider text-sm text-indigo-100 mb-2">
                        Assignment Builder
                    </p>

                    <h1 className="text-4xl font-bold">
                        Create Assignment
                    </h1>

                    <p className="mt-3 text-indigo-100 max-w-2xl">
                        Build assignments,
                        choose questions,
                        assign marks, and
                        publish learning
                        activities for your
                        classroom.
                    </p>
                </div>

                {/* MAIN */}

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT PANEL */}

                    <div className="lg:col-span-2 space-y-6">

                        {/* BASIC DETAILS */}

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                Assignment Details
                            </h2>

                            <div className="space-y-5">

                                {/* TITLE */}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Assignment
                                        Title
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Enter assignment title"
                                        value={
                                            title
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setTitle(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                                    />
                                </div>

                                {/* CLASSROOM */}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Classroom
                                    </label>

                                    <select
                                        value={
                                            classroomId
                                        }
                                        disabled={
                                            !!id
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setClassroomId(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 disabled:bg-slate-100"
                                    >
                                        <option value="">
                                            Select
                                            Classroom
                                        </option>

                                        {classrooms.map(
                                            (
                                                c
                                            ) => (
                                                <option
                                                    key={
                                                        c._id
                                                    }
                                                    value={
                                                        c._id
                                                    }
                                                >
                                                    {
                                                        c.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* DUE DATE */}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Due Date
                                    </label>

                                    <input
                                        type="datetime-local"
                                        value={
                                            dueDate
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setDueDate(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FILTERS */}

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                Question Filters
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* CATEGORY */}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                                    >
                                        <option value="">
                                            Select
                                            Category
                                        </option>

                                        <option value="reading">
                                            Reading
                                        </option>

                                        <option value="writing">
                                            Writing
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
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Question Type
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
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                                    >
                                        <option value="">
                                            All Types
                                        </option>

                                        <option value="3_option_mcq">
                                            3
                                            Option
                                            MCQ
                                        </option>

                                        <option value="yesno">
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

                                        <option value="calculations">
                                            Calculations
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* QUESTIONS */}

                        <div className="space-y-6">

                            {questions.map(
                                (
                                    q,
                                    index
                                ) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
                                    >

                                        {/* TOP */}

                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-bold text-slate-900">
                                                Question{" "}
                                                {index +
                                                    1}
                                            </h2>

                                            {questions.length >
                                                1 && (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveQuestion(
                                                            index
                                                        )
                                                    }
                                                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl font-semibold transition"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>

                                        {/* SELECT QUESTION */}

                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                                                className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 disabled:bg-slate-100"
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
                                                <label className="block text-sm font-semibold text-slate-700 mb-4">
                                                    Select
                                                    Sub
                                                    Questions
                                                </label>

                                                <div className="space-y-3">

                                                    {getSelectedQuestion(
                                                        q.question_id
                                                    )?.sub_questions?.map(
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

                                                            return (
                                                                <label
                                                                    key={
                                                                        sub.id
                                                                    }
                                                                    className="flex items-start gap-4 p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={q.sub_questions.includes(
                                                                            sub.id
                                                                        )}
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            const updated =
                                                                                [
                                                                                    ...questions,
                                                                                ];

                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .checked
                                                                            ) {
                                                                                updated[
                                                                                    index
                                                                                ].sub_questions.push(
                                                                                    sub.id
                                                                                );
                                                                            } else {
                                                                                updated[
                                                                                    index
                                                                                ].sub_questions =
                                                                                    updated[
                                                                                        index
                                                                                    ].sub_questions.filter(
                                                                                        (
                                                                                            s
                                                                                        ) =>
                                                                                            s !==
                                                                                            sub.id
                                                                                    );
                                                                            }

                                                                            setQuestions(
                                                                                updated
                                                                            );
                                                                        }}
                                                                        className="mt-1 w-5 h-5 accent-indigo-600"
                                                                    />

                                                                    <div>
                                                                        <p className="font-medium text-slate-800">
                                                                            {getDisplayText()}
                                                                        </p>

                                                                        <p className="text-sm text-slate-500 mt-1">
                                                                            ID:{" "}
                                                                            {
                                                                                sub.id
                                                                            }
                                                                        </p>
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
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Marks
                                                Per Sub
                                                Question
                                            </label>

                                            <input
                                                type="number"
                                                min="1"
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
                                                className="w-full md:w-40 px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                )
                            )}

                            {/* ADD QUESTION */}

                            <button
                                onClick={
                                    handleAddQuestion
                                }
                                className="w-full bg-white hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl py-6 text-slate-700 font-semibold text-lg transition"
                            >
                                + Add Another
                                Question
                            </button>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}

                    <div className="space-y-6">

                        {/* SUMMARY */}

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sticky top-24">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                Summary
                            </h2>

                            <div className="space-y-5">

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">
                                        Questions
                                    </span>

                                    <span className="font-bold text-slate-900">
                                        {
                                            questions.length
                                        }
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">
                                        Classroom
                                    </span>

                                    <span className="font-bold text-slate-900 text-right">
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

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">
                                        Category
                                    </span>

                                    <span className="font-bold text-slate-900 capitalize">
                                        {category ||
                                            "-"}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <button
                                        onClick={
                                            handleSubmit
                                        }
                                        disabled={
                                            loading
                                        }
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-lg transition"
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

                {/* commented future sections */}

                {/* <div>Assignment Templates</div> */}

                {/* <div>Auto Question Generator</div> */}

                {/* <div>AI Difficulty Suggestions</div> */}
            </div>
        </div>
    );
};

export default CreateAssignment;