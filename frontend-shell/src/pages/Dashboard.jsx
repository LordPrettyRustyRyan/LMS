import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

import Navbar from "../components/Navbar";

import { getMyClasses } from "../api/classrooms";
import { getClassroomAssignments } from "../api/assignments";

const Dashboard = () => {
    const { user } = useAuth();
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const isGuest = params.get("guest") === "true";

    let role = "guest";

    if (!isGuest && user) {
        role = user.role;
    }

    const [classes, setClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // ---------------- FETCH ----------------

    useEffect(() => {
        if (role === "guest") return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // -------- CLASSES --------
                const classData = await getMyClasses();

                setClasses(classData || []);

                // -------- ASSIGNMENTS --------
                let allAssignments = [];

                for (const cls of classData) {
                    const a = await getClassroomAssignments(
                        cls._id
                    );

                    const enriched = (a || []).map(
                        (item) => ({
                            ...item,
                            classroom_id: cls._id,
                            classroom_name: cls.name,
                        })
                    );

                    allAssignments.push(...enriched);
                }

                // -------- FILTER --------

                if (role === "teacher") {
                    allAssignments.sort(
                        (a, b) =>
                            new Date(b.created_at) -
                            new Date(a.created_at)
                    );
                }

                if (role === "student") {
                    allAssignments = allAssignments
                        .filter(
                            (a) =>
                                a.status === "published"
                        )
                        .sort(
                            (a, b) =>
                                new Date(
                                    b.published_at ||
                                        b.created_at
                                ) -
                                new Date(
                                    a.published_at ||
                                        a.created_at
                                )
                        );
                }

                setAssignments(allAssignments);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [role]);

    // ---------------- GUEST ----------------

    if (role === "guest") {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar role="guest" />

                <div className="max-w-6xl mx-auto px-6 py-16">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 text-center">
                        
                        <div className="text-6xl mb-6">
                            👋
                        </div>

                        <h1 className="text-4xl font-extrabold text-slate-900">
                            Welcome Guest
                        </h1>

                        <p className="text-slate-600 mt-4 text-lg">
                            Explore the learning platform before creating an account.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/register")
                            }
                            className="mt-8 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg transition"
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------- UI ----------------

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar role={role} />

            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* HERO */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
                    
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        
                        <div>
                            <p className="uppercase tracking-wider text-indigo-100 text-sm font-semibold">
                                Dashboard
                            </p>

                            <h1 className="text-4xl lg:text-5xl font-extrabold mt-2">
                                Welcome{" "}
                                {user?.name || "User"}
                            </h1>

                            <p className="mt-4 text-indigo-100 text-lg">
                                {role === "teacher"
                                    ? "Manage classrooms and assignments for your students."
                                    : "Track your assignments and continue learning."}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 min-w-[140px]">
                                <p className="text-indigo-100 text-sm">
                                    Classes
                                </p>

                                <h3 className="text-3xl font-bold mt-2">
                                    {classes.length}
                                </h3>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 min-w-[140px]">
                                <p className="text-indigo-100 text-sm">
                                    Assignments
                                </p>

                                <h3 className="text-3xl font-bold mt-2">
                                    {assignments.length}
                                </h3>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ASSIGNMENTS */}
                <div className="mt-10">

                    <div className="flex items-center justify-between mb-6">
                        
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                {role === "teacher"
                                    ? "Recent Assignments"
                                    : "New Assignments"}
                            </h2>

                            <p className="text-slate-500 mt-1">
                                Latest activity from your classrooms
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-3xl p-10 text-center shadow border border-slate-200">
                            <p className="text-slate-500">
                                Loading assignments...
                            </p>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center shadow border border-slate-200">
                            
                            <div className="text-5xl mb-4">
                                📚
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800">
                                No Assignments Yet
                            </h3>

                            <p className="text-slate-500 mt-3">
                                {role === "teacher"
                                    ? "Create assignments for your students."
                                    : "Join classes to receive assignments."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                            
                            {assignments
                                .slice(0, 3)
                                .map((a) => (
                                    <div
                                        key={a._id}
                                        onClick={() =>
                                            navigate(
                                                `/classes/${a.classroom_id}`,
                                                {
                                                    state: {
                                                        view: "assignments",
                                                    },
                                                }
                                            )
                                        }
                                        className="bg-white rounded-3xl p-6 shadow border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition cursor-pointer"
                                    >
                                        
                                        <div className="flex items-start justify-between">
                                            
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">
                                                    {a.title}
                                                </h3>

                                                <p className="text-slate-500 mt-2">
                                                    {
                                                        a.classroom_name
                                                    }
                                                </p>
                                            </div>

                                            <div
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    a.status ===
                                                    "published"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {a.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* CLASSES */}
                <div className="mt-14">

                    <div className="flex items-center justify-between mb-6">
                        
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Your Classes
                            </h2>

                            <p className="text-slate-500 mt-1">
                                Access your active classrooms
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                navigate("/classes")
                            }
                            className="px-5 py-3 rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 transition font-semibold"
                        >
                            View All
                        </button>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-3xl p-10 text-center shadow border border-slate-200">
                            <p className="text-slate-500">
                                Loading classes...
                            </p>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center shadow border border-slate-200">
                            
                            <div className="text-5xl mb-4">
                                🏫
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800">
                                No Classes Yet
                            </h3>

                            <p className="text-slate-500 mt-3">
                                {role === "teacher"
                                    ? "Create your first classroom."
                                    : "Join a classroom to begin learning."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                            
                            {classes
                                .slice(0, 4)
                                .map((c) => (
                                    <div
                                        key={c._id}
                                        onClick={() =>
                                            navigate(
                                                `/classes/${c._id}`
                                            )
                                        }
                                        className="bg-white rounded-3xl p-6 shadow border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition cursor-pointer"
                                    >
                                        
                                        <div className="flex items-center justify-between">
                                            
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">
                                                📘
                                            </div>

                                            <div className="text-right">
                                                <p className="text-slate-400 text-sm">
                                                    Students
                                                </p>

                                                <p className="font-bold text-slate-900">
                                                    {c.students
                                                        ?.length ||
                                                        0}
                                                </p>
                                            </div>
                                        </div>

                                        <h3 className="mt-5 text-xl font-bold text-slate-900">
                                            {c.name}
                                        </h3>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;