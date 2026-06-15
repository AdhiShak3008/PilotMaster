import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/gaugepilot",
});

export async function runBenchmark(payload, token) {
  const response = await API.post(
    "/benchmark/run",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
export async function uploadDocument(file, token) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await API.post(
    "/docs/upload",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}