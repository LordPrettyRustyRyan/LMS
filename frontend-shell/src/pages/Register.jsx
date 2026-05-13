import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "student",
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            await registerUser(form);

            navigate("/login");
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert("Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 flex items-center justify-center px-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">

                {/* HEADER */}
                <div className="text-center mb-8">

                    <h1 className="text-3xl font-extrabold text-slate-900">
                        Create Account
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Start your learning journey
                    </p>
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    {/* NAME */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Full Name
                        </label>

                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    name: e.target.value,
                                })
                            }
                            className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* EMAIL */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    email: e.target.value,
                                })
                            }
                            className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Create password"
                            value={form.password}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    password: e.target.value,
                                })
                            }
                            className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* ROLE */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Role
                        </label>

                        <select
                            value={form.role}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    role: e.target.value,
                                })
                            }
                            className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition bg-white"
                        >
                            <option value="student">
                                Student
                            </option>

                            <option value="teacher">
                                Teacher
                            </option>
                        </select>
                    </div>

                    {/* BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg transition disabled:opacity-60"
                    >
                        {loading
                            ? "Creating Account..."
                            : "Register"}
                    </button>
                </form>

                {/* FOOTER */}
                <p className="text-center text-slate-500 mt-8">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-indigo-600 font-semibold hover:text-indigo-700"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;