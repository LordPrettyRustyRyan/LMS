import { useNavigate } from "react-router-dom";

const Entry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 flex items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">

        {/* LOGO / TITLE */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-black/5 px-5 py-2 backdrop-blur-md mb-8">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>

            <span className="text-sm text-white-200">
              Interactive Learning Platform
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">
            <span className="text-indigo-600">Learning </span> Platform
          </h1>

          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto">
            Interactive assignments, speech learning,
            handwriting practice, comprehension,
            grading and classroom management —
            all in one place.
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/login")}
            className="
                            px-8 py-4 rounded-2xl
                            bg-indigo-600 hover:bg-indigo-700
                            text-white font-semibold text-lg
                            shadow-lg hover:shadow-xl
                            transition-all duration-200
                        "
          >
            Login / Register
          </button>

          <button
            onClick={() =>
              navigate("/dashboard?guest=true")
            }
            className="
                            px-8 py-4 rounded-2xl
                            bg-white hover:bg-gray-100
                            border border-gray-200
                            text-gray-800 font-semibold text-lg
                            shadow-md hover:shadow-lg
                            transition-all duration-200
                        "
          >
            Continue as Guest
          </button>
        </div>

        {/* FOOTER */}
        <div className="mt-14 text-sm text-gray-500">
          Built for modern classrooms and interactive learning.
        </div>
      </div>
    </div>
  );
};

export default Entry;