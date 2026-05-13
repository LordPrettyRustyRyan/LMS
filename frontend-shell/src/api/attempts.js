import API from "./client";

// START OR RESUME
export const startAttempt = async (assignmentId) => {
  const res = await API.post(`/attempts/assignments/${assignmentId}/attempt`);
  return res.data.data;
};

// GET ATTEMPT
export const getAttempt = async (attemptId) => {
  const res = await API.get(`/attempts/${attemptId}`);
  return res.data.data;
};

// SUBMIT
export const submitAttempt = async (attemptId) => {
  const res = await API.post(`/attempts/${attemptId}/submit`);
  return res.data.data;
};

// GET MY ATTEMPTS
export const getMyAttempts = async () => {
  const res = await API.get(`/attempts/students/me`);
  return res.data.data;
};

// GRADE ATTEMPT
export const gradeAttempt = async (attemptId) => {
  const res = await API.patch(`/attempts/${attemptId}/grade`);
  return res.data.data;
};

// FULL ATTEMPT VIEW
export const getFullAttempt = async (attemptId) => {
  const res = await API.get(`/attempts/${attemptId}/full`);
  return res.data.data;
};