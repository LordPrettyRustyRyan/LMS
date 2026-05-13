import API from "./client";

// GET CLASSROOM ASSIGNMENTS
export const getClassroomAssignments = async (classroomId) => {
  const res = await API.get(`/assignments/classroom/${classroomId}`);
  return res.data.data;
};

// CREATE
export const createAssignment = async (payload) => {
  const res = await API.post("/assignments/", payload);
  return res.data.data;
};

// PUBLISH
export const publishAssignment = async (id) => {
  const res = await API.patch(`/assignments/${id}/publish`);
  return res.data.data;
};

// CLOSE
export const closeAssignment = async (id) => {
  const res = await API.patch(`/assignments/${id}/close`);
  return res.data.data;
};

// GET ATTEMPTS (teacher)
export const getAssignmentAttempts = async (id) => {
  const res = await API.get(`/assignments/${id}/attempts`);
  return res.data.data;
};

// GET ATTEMPTS (student)
export const getAssignment = async (id) => {
  const res = await API.get(`/assignments/${id}`);
  return res.data.data;
};