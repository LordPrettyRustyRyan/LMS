import { useEffect, useState } from "react";
import {
    useParams,
    useSearchParams,
    useNavigate,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

import Navbar from "../components/Navbar";

import { getClassroom } from "../api/classrooms";
import { getMyAttempts } from "../api/attempts";

import {
    getClassroomAssignments,
    publishAssignment,
    closeAssignment,
    getAssignmentAttempts,
} from "../api/assignments";

const ClassroomDetail = () => {
    const { id } = useParams();

    const { user } = useAuth();

    const [params] = useSearchParams();

    const navigate = useNavigate();
    const location = useLocation();

    const isGuest = params.get("guest") === "true";

    const role = isGuest
        ? "guest"
        : user?.role;

    // ---------------- STATE ----------------

    const [classroom, setClassroom] = useState(null);

    const [classesLoading, setClassesLoading] =
        useState(true);

    const [assignments, setAssignments] =
        useState([]);

    const [assignLoading, setAssignLoading] =
        useState(false);

    const [submissions, setSubmissions] =
        useState([]);

    const [subLoading, setSubLoading] =
        useState(false);

    const [attempts, setAttempts] =
        useState([]);

    const [view, setView] =
        useState("default");

    // ---------------- MAP ----------------

    const assignmentMap = {};

    assignments.forEach((a) => {
        assignmentMap[a._id] = a.title;
    });

    // ---------------- FETCH CLASS ----------------

    const fetchAssignments = async () => {
        try {
            setAssignLoading(true);

            const data =
                await getClassroomAssignments(id);

            setAssignments(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setAssignLoading(false);
        }
    };

    useEffect(() => {
        if (isGuest) return;

        if (location.state?.view) {
            setView(location.state.view);
        }

        const fetchClassroom = async () => {
            try {
                const data = await getClassroom(id);

                setClassroom(data);
            } catch (err) {
                console.error(err);
            } finally {
                setClassesLoading(false);
            }
        };

        fetchClassroom();
        fetchAssignments();
    }, [id, location.state]);

    // ---------------- FETCH STUDENT SUBMISSIONS ----------------

    useEffect(() => {
        if (!classroom) return;

        if (role !== "student") return;

        const fetchSubmissions = async () => {
            try {
                setSubLoading(true);

                const data =
                    await getMyAttempts();

                const filtered = data.filter(
                    (a) =>
                        a.classroom_id ===
                        classroom._id
                );

                setSubmissions(filtered);
            } catch (err) {
                console.error(err);
            } finally {
                setSubLoading(false);
            }
        };

        fetchSubmissions();
    }, [classroom, role]);

    // ---------------- GUEST ----------------

    if (role === "guest") {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar role={role} />

                <div className="max-w-3xl mx-auto px-6 py-20 text-center">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10">
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">
                            Classroom Access Required
                        </h1>

                        <p className="text-slate-600 mb-8">
                            Login to view classrooms,
                            assignments, and student
                            progress.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/login")
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar role={role} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* ---------------- LOADING ---------------- */}

                {classesLoading && (
                    <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center">
                        <p className="text-slate-600 text-lg">
                            Loading classroom...
                        </p>
                    </div>
                )}

                {/* ---------------- MAIN ---------------- */}

                {classroom && (
                    <>
                        {/* HERO */}

                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                                <div>
                                    <p className="uppercase tracking-wider text-sm text-indigo-100 mb-2">
                                        Classroom
                                    </p>

                                    <h1 className="text-4xl font-bold">
                                        {classroom.name}
                                    </h1>

                                    <p className="mt-3 text-indigo-100">
                                        {role ===
                                        "teacher"
                                            ? "Manage assignments, students, and submissions."
                                            : "Track assignments and your learning progress."}
                                    </p>
                                </div>

                                {/* Teacher Invite */}

                                {role ===
                                    "teacher" && (
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[260px]">
                                        <p className="text-sm text-indigo-100 mb-2">
                                            Invite Code
                                        </p>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-2xl font-bold tracking-wider">
                                                {
                                                    classroom.invite_code
                                                }
                                            </span>

                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        classroom.invite_code
                                                    );

                                                    alert(
                                                        "Copied!"
                                                    );
                                                }}
                                                className="bg-white text-indigo-700 px-4 py-2 rounded-xl font-semibold hover:bg-indigo-50 transition"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ---------------- STUDENT ---------------- */}

                        {role === "student" && (
                            <div className="mt-8">

                                {/* TOGGLE */}

                                <div className="flex flex-wrap gap-3 mb-8">
                                    <button
                                        onClick={() =>
                                            setView(
                                                "assignments"
                                            )
                                        }
                                        className={`px-5 py-3 rounded-2xl font-semibold transition ${
                                            view ===
                                            "assignments"
                                                ? "bg-indigo-600 text-white shadow-md"
                                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        Assignments
                                    </button>

                                    <button
                                        onClick={() =>
                                            setView(
                                                "submissions"
                                            )
                                        }
                                        className={`px-5 py-3 rounded-2xl font-semibold transition ${
                                            view ===
                                            "submissions"
                                                ? "bg-indigo-600 text-white shadow-md"
                                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        My Submissions
                                    </button>
                                </div>

                                {/* ASSIGNMENTS */}

                                {view ===
                                    "assignments" && (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                                        <div className="p-6 border-b border-slate-200">
                                            <h2 className="text-2xl font-bold text-slate-900">
                                                Assignments
                                            </h2>
                                        </div>

                                        {assignLoading ? (
                                            <div className="p-8 text-slate-600">
                                                Loading assignments...
                                            </div>
                                        ) : assignments.length ===
                                          0 ? (
                                            <div className="p-8 text-slate-500">
                                                No assignments yet.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-slate-100">
                                                        <tr className="text-left">
                                                            <th className="px-6 py-4 text-slate-700 font-semibold">
                                                                Title
                                                            </th>

                                                            <th className="px-6 py-4 text-slate-700 font-semibold">
                                                                Status
                                                            </th>

                                                            <th className="px-6 py-4 text-slate-700 font-semibold">
                                                                Due Date
                                                            </th>

                                                            <th className="px-6 py-4 text-slate-700 font-semibold">
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {assignments.map(
                                                            (
                                                                a
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        a._id
                                                                    }
                                                                    className="border-t border-slate-100 hover:bg-slate-50 transition"
                                                                >
                                                                    <td className="px-6 py-5 font-medium text-slate-800">
                                                                        {
                                                                            a.title
                                                                        }
                                                                    </td>

                                                                    <td className="px-6 py-5">
                                                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                                                                            {
                                                                                a.status
                                                                            }
                                                                        </span>
                                                                    </td>

                                                                    <td className="px-6 py-5 text-slate-600">
                                                                        {a.due_date ||
                                                                            "-"}
                                                                    </td>

                                                                    <td className="px-6 py-5">
                                                                        <button
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    `/assignments/${a._id}/play`
                                                                                )
                                                                            }
                                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold transition"
                                                                        >
                                                                            Start
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* SUBMISSIONS */}

                                {view ===
                                    "submissions" && (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                                        <div className="p-6 border-b border-slate-200">
                                            <h2 className="text-2xl font-bold text-slate-900">
                                                My
                                                Submissions
                                            </h2>
                                        </div>

                                        {subLoading ? (
                                            <div className="p-8 text-slate-600">
                                                Loading submissions...
                                            </div>
                                        ) : submissions.length ===
                                          0 ? (
                                            <div className="p-8 text-slate-500">
                                                No submissions
                                                yet.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-slate-100">
                                                        <tr className="text-left">
                                                            <th className="px-6 py-4">
                                                                Assignment
                                                            </th>

                                                            <th className="px-6 py-4">
                                                                Status
                                                            </th>

                                                            <th className="px-6 py-4">
                                                                Progress
                                                            </th>

                                                            <th className="px-6 py-4">
                                                                Score
                                                            </th>

                                                            <th className="px-6 py-4">
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {submissions.map(
                                                            (
                                                                a
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        a._id
                                                                    }
                                                                    className="border-t border-slate-100 hover:bg-slate-50 transition"
                                                                >
                                                                    <td className="px-6 py-5 font-medium">
                                                                        {assignmentMap[
                                                                            a
                                                                                .assignment_id
                                                                        ] ||
                                                                            "Unknown"}
                                                                    </td>

                                                                    <td className="px-6 py-5 text-slate-600">
                                                                        {a.status ===
                                                                            "in_progress" &&
                                                                            "In Progress"}

                                                                        {a.status ===
                                                                            "submitted" &&
                                                                            "Submitted"}

                                                                        {a.status ===
                                                                            "graded" &&
                                                                            "Graded"}
                                                                    </td>

                                                                    <td className="px-6 py-5 text-slate-600">
                                                                        {
                                                                            a
                                                                                .progress
                                                                                ?.answered_count
                                                                        }
                                                                        /
                                                                        {
                                                                            a
                                                                                .progress
                                                                                ?.total_questions
                                                                        }
                                                                    </td>

                                                                    <td className="px-6 py-5 text-slate-600">
                                                                        {a.status ===
                                                                        "graded"
                                                                            ? `${a.score}/${a.max_score}`
                                                                            : "-"}
                                                                    </td>

                                                                    <td className="px-6 py-5">
                                                                        <button
                                                                            onClick={() => {
                                                                                if (
                                                                                    a.status ===
                                                                                    "in_progress"
                                                                                ) {
                                                                                    navigate(
                                                                                        `/assignments/${a.assignment_id}/play`
                                                                                    );
                                                                                } else {
                                                                                    navigate(
                                                                                        `/attempts/${a._id}`
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-semibold transition"
                                                                        >
                                                                            {a.status ===
                                                                            "in_progress"
                                                                                ? "Resume"
                                                                                : "View"}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ---------------- TEACHER ---------------- */}

                        {role === "teacher" && (
                            <div className="mt-8">

                                {/* ACTIONS */}

                                <div className="flex flex-wrap gap-3 mb-8">
                                    <button
                                        onClick={() =>
                                            setView(
                                                "students"
                                            )
                                        }
                                        className={`px-5 py-3 rounded-2xl font-semibold transition ${
                                            view ===
                                            "students"
                                                ? "bg-indigo-600 text-white shadow-md"
                                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        Students
                                    </button>

                                    <button
                                        onClick={() =>
                                            setView(
                                                "assignments"
                                            )
                                        }
                                        className={`px-5 py-3 rounded-2xl font-semibold transition ${
                                            view ===
                                            "assignments"
                                                ? "bg-indigo-600 text-white shadow-md"
                                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        Assignments
                                    </button>

                                    <button
                                        onClick={() =>
                                            navigate(
                                                "assignments/create"
                                            )
                                        }
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-semibold transition"
                                    >
                                        + Create Assignment
                                    </button>
                                </div>

                                {/* STUDENTS */}

                                {view ===
                                    "students" && (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                                        <div className="p-6 border-b border-slate-200">
                                            <h2 className="text-2xl font-bold text-slate-900">
                                                Students
                                            </h2>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-slate-100">
                                                    <tr className="text-left">
                                                        <th className="px-6 py-4">
                                                            Student
                                                            ID
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {classroom.students.map(
                                                        (
                                                            s
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    s
                                                                }
                                                                className="border-t border-slate-100"
                                                            >
                                                                <td className="px-6 py-5 text-slate-700">
                                                                    {
                                                                        s
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* ASSIGNMENTS */}

                                {view ===
                                    "assignments" && (
                                    <div className="space-y-6">

                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                                            <div className="p-6 border-b border-slate-200">
                                                <h2 className="text-2xl font-bold text-slate-900">
                                                    Assignments
                                                </h2>
                                            </div>

                                            {assignLoading ? (
                                                <div className="p-8 text-slate-600">
                                                    Loading assignments...
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-slate-100">
                                                            <tr className="text-left">
                                                                <th className="px-6 py-4">
                                                                    Title
                                                                </th>

                                                                <th className="px-6 py-4">
                                                                    Status
                                                                </th>

                                                                <th className="px-6 py-4">
                                                                    Actions
                                                                </th>

                                                                <th className="px-6 py-4">
                                                                    Attempts
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {assignments.map(
                                                                (
                                                                    a
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            a._id
                                                                        }
                                                                        className="border-t border-slate-100 hover:bg-slate-50 transition"
                                                                    >
                                                                        <td className="px-6 py-5 font-medium">
                                                                            {
                                                                                a.title
                                                                            }
                                                                        </td>

                                                                        <td className="px-6 py-5">
                                                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                                                                                {
                                                                                    a.status
                                                                                }
                                                                            </span>
                                                                        </td>

                                                                        <td className="px-6 py-5">
                                                                            {a.status ===
                                                                                "draft" && (
                                                                                <button
                                                                                    onClick={async () => {
                                                                                        await publishAssignment(
                                                                                            a._id
                                                                                        );

                                                                                        fetchAssignments();
                                                                                    }}
                                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition"
                                                                                >
                                                                                    Publish
                                                                                </button>
                                                                            )}

                                                                            {a.status ===
                                                                                "published" && (
                                                                                <button
                                                                                    onClick={async () => {
                                                                                        await closeAssignment(
                                                                                            a._id
                                                                                        );

                                                                                        fetchAssignments();
                                                                                    }}
                                                                                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-semibold transition"
                                                                                >
                                                                                    Close
                                                                                </button>
                                                                            )}
                                                                        </td>

                                                                        <td className="px-6 py-5">
                                                                            <button
                                                                                onClick={async () => {
                                                                                    const data =
                                                                                        await getAssignmentAttempts(
                                                                                            a._id
                                                                                        );

                                                                                    setAttempts(
                                                                                        data
                                                                                    );
                                                                                }}
                                                                                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-semibold transition"
                                                                            >
                                                                                View
                                                                                Attempts
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        {/* ATTEMPTS */}

                                        {attempts.length >
                                            0 && (
                                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                                                <div className="p-6 border-b border-slate-200">
                                                    <h3 className="text-2xl font-bold text-slate-900">
                                                        Attempts
                                                    </h3>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-slate-100">
                                                            <tr className="text-left">
                                                                <th className="px-6 py-4">
                                                                    Student
                                                                    ID
                                                                </th>

                                                                <th className="px-6 py-4">
                                                                    Status
                                                                </th>

                                                                <th className="px-6 py-4">
                                                                    Score
                                                                </th>

                                                                <th className="px-6 py-4">
                                                                    Open
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {attempts.map(
                                                                (
                                                                    at
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            at._id
                                                                        }
                                                                        className="border-t border-slate-100"
                                                                    >
                                                                        <td className="px-6 py-5">
                                                                            {
                                                                                at.student_id
                                                                            }
                                                                        </td>

                                                                        <td className="px-6 py-5">
                                                                            {
                                                                                at.status
                                                                            }
                                                                        </td>

                                                                        <td className="px-6 py-5">
                                                                            {at.score ??
                                                                                "-"}
                                                                        </td>

                                                                        <td className="px-6 py-5">
                                                                            <button
                                                                                onClick={() =>
                                                                                    navigate(
                                                                                        `/attempts/${at._id}`
                                                                                    )
                                                                                }
                                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition"
                                                                            >
                                                                                Open
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ClassroomDetail;