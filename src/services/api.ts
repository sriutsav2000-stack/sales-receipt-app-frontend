const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}/${endpoint}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  return res.json();
}

// ---------- Interfaces ----------
export interface ReceiptItemPayload {
  product_id: number;
  quantity: number;
  price: number;
}

export interface ReceiptPayload {
  date: string;
  due_date: string;
  status: string;
  amount: number;
  advance_received: number;
  customer_id: number | null;
  items: ReceiptItemPayload[];
}

export interface TopCustomer {
  customer_id: number;
  name: string;
  total_due: number;
}

export interface DashboardStats {
  total_receipts: number;
  total_revenue: number;
  pending_amount: number;
  completed_receipts: number;
}

export const api = {
  // Customers
  getCustomers: () => request("customers/"),
  addCustomer: (data: any) =>
    request("customers/", { method: "POST", body: JSON.stringify(data) }),

  // Products
  getProducts: () => request("products/"),
  addProduct: (data: any) =>
    request("products/", { method: "POST", body: JSON.stringify(data) }),

  // Receipts
  getReceipts: () => request("receipts/"),
  getTopReceipts: () => request("dashboard/top-receipts/"),
  getTopCustomers: () => request("dashboard/top-customers/"),
  getDashboardStats: () => request("dashboard/stats/"),

  addReceipt: (data: ReceiptPayload) =>
    request("receipts/with-items/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};