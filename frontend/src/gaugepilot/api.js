import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/docpilot",
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