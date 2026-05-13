import API from "./client";

// REGISTER
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

// LOGIN (IMPORTANT: form-data)
export const loginUser = async ({ email, password }) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const res = await API.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return res.data.data; // because of success_response
};

// GET ME
export const getMe = async () => {
  const res = await API.get("/auth/me");
  return res.data;
};

// UPDATE
export const updateMe = async (data) => {
  const res = await API.put("/auth/me", data);
  return res.data;
};

// DELETE
export const deleteMe = async () => {
  const res = await API.delete("/auth/me");
  return res.data;
};