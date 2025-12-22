const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}/${endpoint}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API Error ${res.status} at ${url}:`, errorText);
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

export interface CustomerDetail {
  id: number;
  name: string;
  contact: string;
  email: string;
  address?: string;
  created_at?: string;
}

export interface ReceiptDetail {
  id: number;
  date: string;
  due_date: string;
  quantity: number;
  advance_received: number;
  customer_id: number;
  amount: number;
  total_due: number;
  status: string;
  product_id: number;
  created_at?: string;
}

export interface DashboardStats {
  total_receipts: number;
  total_revenue: number;
  pending_amount: number;
  completed_receipts: number;
}

// Helper function for GET requests
async function get(endpoint: string) {
  return request(endpoint, { method: "GET" });
}

// Helper function for POST requests
async function post(endpoint: string, data: any) {
  return request(endpoint, { 
    method: "POST", 
    body: JSON.stringify(data) 
  });
}

export const api = {
  // Customers
  getCustomers: () => get("customers"),
  addCustomer: (data: any) => post("customers", data),
  getCustomer: (id: number): Promise<CustomerDetail> => 
    get(`customers/${id}`),
  getCustomerReceipts: (customerId: number): Promise<ReceiptDetail[]> => 
    get(`receipts?customer_id=${customerId}`),

  // Products
  getProducts: () => get("products"),
  addProduct: (data: any) => post("products", data),
  getProduct: (id: number): Promise<any> => 
    get(`products/${id}`),

  // Receipts
  getReceipts: (): Promise<ReceiptDetail[]> => get("receipts"),
  getReceipt: (id: number): Promise<ReceiptDetail> => 
    get(`receipts/${id}`),
  getTopReceipts: () => get("dashboard/top-receipts"),
  getTopCustomers: (): Promise<TopCustomer[]> => 
    get("dashboard/top-customers"),
  getDashboardStats: (): Promise<DashboardStats> => 
    get("dashboard/stats"),

  addReceipt: (data: ReceiptPayload) => 
    request("receipts/with-items", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Upload receipt image
  uploadReceiptImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch(`${BASE_URL}/receipts/upload-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }
};