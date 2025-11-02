const API_URL = import.meta.env.VITE_DOCS_API_URL || "http://localhost:5050/api";

async function apiRequest(method: string, endpoint: string, data?: any) {
  const url = `${API_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (data) {
    options.body = JSON.stringify(data);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw error;
  }
  return res.json();
}

export const docsAPI = {
  get: (endpoint: string) => apiRequest("GET", endpoint),
  post: (endpoint: string, data?: any) => apiRequest("POST", endpoint, data),
};

