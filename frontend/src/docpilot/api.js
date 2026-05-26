const API_BASE = "http://127.0.0.1:8000/docpilot";

export const apiRequest = async (endpoint, method = "GET", body = null) => {
    const token = localStorage.getItem("token");
    const headers = {};

    if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(API_BASE + endpoint, {
        method,
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
    });

    return response.json();
};

export const loginRequest = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(API_BASE + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
    });

    return response.json();
};
