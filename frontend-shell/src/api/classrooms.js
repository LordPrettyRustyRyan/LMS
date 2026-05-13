import API from "./client";

// TEACHER → CREATE
export const createClassroom = async (data) => {
  const res = await API.post("/classrooms/", data);
  return res.data.data;
};

// STUDENT → JOIN (query param)
export const joinClassroom = async (invite_code) => {
  const res = await API.post(`/classrooms/join?invite_code=${invite_code}`);
  return res.data.data;
};

// GET MY CLASSES
export const getMyClasses = async () => {
  const res = await API.get("/classrooms/my-classes");
  return res.data.data;
};

// GET SINGLE CLASS
export const getClassroom = async (id) => {
  const res = await API.get(`/classrooms/${id}`);
  return res.data.data;
};