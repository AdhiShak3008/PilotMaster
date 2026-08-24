import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL +
    "/gaugepilot",
});

export async function getModels(token) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const response = await API.get("/models", { headers });
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch {
      // fallback
    }

    const rawApi = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || "",
    });
    const docpilotRes = await rawApi.get("/docpilot/models/", { headers });
    return docpilotRes.data;
  } catch (e) {
    console.error("Failed to fetch models in gaugepilot:", e);
    return [];
  }
}

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
export async function uploadDocument(files, token) {
  const formData = new FormData();
  const fileList = Array.isArray(files) ? files : [files];
  for (const file of fileList) {
    formData.append("files", file);
  }

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

export async function getBenchmarkRuns(token) {
  const response = await API.get(
    "/benchmark/runs",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
export async function getDocuments(token) {
  const response = await API.get(
    "/docs/",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
export async function deleteBenchmarkRun(
  runId,
  token,
) {
  const response = await API.delete(
    `/benchmark/runs/${runId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
export async function resetBenchmarkRuns(
  token,
) {
  const response = await API.delete(
    "/benchmark/runs/reset",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
export async function resetDocuments(
  token,
) {
  const response = await API.delete(
    "/docs/reset",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

// New: trigger AI analysis generation for a specific run
export async function generateAnalysis(runId, token) {
  const response = await API.post(
    `/benchmark/runs/${runId}/generate-analysis`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}