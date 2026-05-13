import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import {
    createClassroom,
    joinClassroom,
    getMyClasses,
} from "../api/classrooms";
import { useSearchParams, useNavigate } from "react-router-dom";

const Classrooms = () => {
    const { user } = useAuth();
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const isGuest = params.get("guest") === "true";
    const role = isGuest ? "guest" : user?.role;

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("");
    const [inviteCode, setInviteCode] = useState("");

    // FETCH CLASSES
    const fetchClasses = async () => {
        try {
            const data = await getMyClasses();
            setClasses(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isGuest) fetchClasses();
    }, []);

    // CREATE (teacher)
    const handleCreate = async () => {
        if (!name.trim()) return alert("Enter class name");

        try {
            await createClassroom({ name });
            setName("");
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.message || "Error");
        }
    };

    // JOIN (student)
    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            return alert("Enter invite code");
        }

        try {
            await joinClassroom(inviteCode);
            setInviteCode("");
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.message || "Error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar role={role} />

            <div className="mx-auto max-w-7xl px-6 py-10">

                {/* PAGE HEADER */}
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900">
                        Classrooms
                    </h1>

                    <p className="mt-3 text-lg text-slate-600">
                        {role === "teacher" &&
                            "Create classrooms and manage your students."}

                        {role === "student" &&
                            "Join classrooms and access assignments from teachers."}

                        {role === "guest" &&
                            "Login to access classroom features."}
                    </p>
                </div>

                {/* GUEST */}
                {role === "guest" && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-800">
                            Explore as Guest
                        </h2>

                        <p className="mt-3 text-slate-600">
                            You can browse the platform, but classroom access
                            requires an account.
                        </p>

                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={() => navigate("/login")}
                                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Login
                            </button>

                            <button
                                onClick={() => navigate("/register")}
                                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Register
                            </button>
                        </div>
                    </div>
                )}

                {/* STUDENT */}
                {role === "student" && (
                    <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Join a Classroom
                        </h2>

                        <p className="mt-2 text-slate-600">
                            Enter the invite code shared by your teacher.
                        </p>

                        <div className="mt-6 flex flex-col gap-4 md:flex-row">
                            <input
                                placeholder="Enter Invite Code"
                                value={inviteCode}
                                onChange={(e) =>
                                    setInviteCode(e.target.value)
                                }
                                className="flex-1 rounded-2xl border border-slate-300 px-5 py-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                            />

                            <button
                                onClick={handleJoin}
                                className="rounded-2xl bg-indigo-600 px-8 py-4 font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Join Classroom
                            </button>
                        </div>
                    </div>
                )}

                {/* TEACHER */}
                {role === "teacher" && (
                    <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Create a Classroom
                        </h2>

                        <p className="mt-2 text-slate-600">
                            Build a learning space for your students.
                        </p>

                        <div className="mt-6 flex flex-col gap-4 md:flex-row">
                            <input
                                placeholder="Enter Class Name"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                className="flex-1 rounded-2xl border border-slate-300 px-5 py-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                            />

                            <button
                                onClick={handleCreate}
                                className="rounded-2xl bg-indigo-600 px-8 py-4 font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Create Classroom
                            </button>
                        </div>
                    </div>
                )}

                {/* CLASS LIST */}
                {!isGuest && (
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-3xl font-bold text-slate-900">
                                Your Classes
                            </h2>

                            <div className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                                {classes.length} Classes
                            </div>
                        </div>

                        {loading ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                <p className="text-lg text-slate-500">
                                    Loading classrooms...
                                </p>
                            </div>
                        ) : classes.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">
                                <h3 className="text-2xl font-bold text-slate-800">
                                    No classrooms yet
                                </h3>

                                <p className="mt-3 text-slate-500">
                                    {role === "teacher"
                                        ? "Create your first classroom to begin teaching."
                                        : "Join a classroom using your teacher's invite code."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {classes.map((cls) => (
                                    <div
                                        key={cls._id}
                                        onClick={() =>
                                            navigate(
                                                `/classes/${cls._id}${
                                                    role === "guest"
                                                        ? "?guest=true"
                                                        : ""
                                                }`
                                            )
                                        }
                                        className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                    >
                                        {/* TOP */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700">
                                                {cls.name?.charAt(0)?.toUpperCase()}
                                            </div>

                                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                Classroom
                                            </div>
                                        </div>

                                        {/* INFO */}
                                        <div className="mt-5">
                                            <h3 className="text-xl font-bold text-slate-900 transition group-hover:text-indigo-600">
                                                {cls.name}
                                            </h3>

                                            <p className="mt-2 text-sm text-slate-500">
                                                {role === "teacher"
                                                    ? `${cls.students?.length || 0} students enrolled`
                                                    : "Tap to open classroom"}
                                            </p>
                                        </div>

                                        {/* FOOTER */}
                                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                            <span className="text-sm font-medium text-slate-500">
                                                Open Classroom
                                            </span>

                                            <span className="text-lg text-indigo-600 transition group-hover:translate-x-1">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Classrooms;