import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const createAssignment = async (data, token) => {
  const res = await axios.post(`${API}/assignments/`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data.data;
};