import API from "./client";

// GET QUESTIONS WITH FILTER
// export const getQuestions = async ({ category, type }) => {
//   const params = {};

//   if (category) params.category = category;
//   if (type) params.qtype = type;

//   const res = await API.get("/questions", { params });
//   return res.data.data;
// };

// GET JUST QUESTIONS
export const getQuestions = async (params = {}) => {
  const res = await API.get("/questions", { params });
  return res.data.data;
};