import API from "./client";

// STUDENT
export const getResponses = async (attemptId) => {
    const res = await API.get(`/responses/attempts/${attemptId}`);
    return res.data.data;
};

// TEACHER
export const getTeacherResponses = async (attemptId) => {
    const res = await API.get(`/responses/attempts/${attemptId}/teacher`);
    return res.data.data;
};

// SAVE
export const saveResponse = async (payload) => {
    const res = await API.post("/responses/", payload);
    return res.data.data;
};

// GRADE
export const gradeResponse = async (responseId, payload) => {
    const res = await API.patch(
        `/responses/${responseId}/grade`,
        payload
    );
    return res.data.data;
};