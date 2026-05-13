import api from "./client";

export const uploadMedia = async (
    file,
    folder = "uploads"
) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("folder", folder);

    const res = await api.post(
        "/media/upload",
        formData,
        {
            headers: {
                "Content-Type":
                    "multipart/form-data",
            },
        }
    );

    return res.data;
};