import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Navbar = ({ role }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isGuest = role === "guest";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* LEFT NAV */}
        <div className="flex items-center gap-3">

          {/* LOGO */}
          <div
            onClick={() =>
              navigate(`/dashboard${isGuest ? "?guest=true" : ""}`)
            }
            className="mr-4 cursor-pointer text-2xl font-black tracking-tight text-indigo-600"
          >
            Nitin and Sidharth's Learning App
          </div>

          {/* NAV BUTTONS */}
          <button
            onClick={() =>
              navigate(`/dashboard${isGuest ? "?guest=true" : ""}`)
            }
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Home
          </button>

          <button
            onClick={() =>
              navigate(`/classes${isGuest ? "?guest=true" : ""}`)
            }
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Classes
          </button>

          {/* <button onClick={() => navigate(`/work${role === "guest" ? "?guest=true" : ""}`)}> Work </button> */}

          {/* <button onClick={() => navigate("/phonics")}>Phonics</button> */}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {isGuest ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="rounded-xl border border-slate-300 px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/register")}
                className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-md transition hover:bg-indigo-700"
              >
                Register
              </button>
            </>
          ) : (
            <>
              {/* USER INFO */}
              <div className="hidden text-right sm:block">
                <p className="text-sm text-slate-500">
                  Signed in as
                </p>
                <p className="font-semibold text-slate-800">
                  {user?.name}
                </p>
              </div>

              {/* AVATAR */}
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              {/* LOGOUT */}
              <button
                onClick={logout}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-600 transition hover:bg-red-100"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;