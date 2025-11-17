const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  getCustomers: () => request("/customers/"),
  addCustomer: (data: any) =>
    request("/customers/", { method: "POST", body: JSON.stringify(data) }),
  getProducts: () => request("/products/"),
  addProduct: (data: any) =>
    request("/products/", { method: "POST", body: JSON.stringify(data) }),
  getReceipts: () => request("/receipts/"),
  addReceipt: (data: any) =>
    request("/receipts/", { method: "POST", body: JSON.stringify(data) }),
};
