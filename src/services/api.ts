// src/services/api.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

console.log("API Base URL:", BASE_URL);

// Token management
const getToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  console.log("Retrieved token:", token ? "***" + token.slice(-8) : "No token");
  return token;
};

const setToken = (token: string) => {
  console.log("Setting token: ***" + token.slice(-8));
  localStorage.setItem('authToken', token);
};

const removeToken = () => {
  console.log("Removing token");
  localStorage.removeItem('authToken');
};

const getAuthHeaders = () => {
  const token = getToken();
  const headers: HeadersInit = { 
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Adding Authorization header");
  }
  
  return headers;
};

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}/${endpoint}`;
  console.log(`📤 API Request: ${options.method || 'GET'} ${url}`);
  
  const headers = getAuthHeaders();
  
  try {
    const res = await fetch(url, {
      headers,
      ...options,
    });

    console.log(`📥 API Response Status: ${res.status} ${res.statusText}`);
    
    const responseText = await res.text();
    
    if (!res.ok) {
      console.error(`❌ API Error ${res.status}:`, responseText);
      let errorMessage = `API Error ${res.status}`;
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorData.detail || responseText;
      } catch (e) {
        errorMessage = responseText || `Request failed with status ${res.status}`;
      }
      
      throw new Error(errorMessage);
    }

    // Try to parse JSON
    try {
      const data = responseText ? JSON.parse(responseText) : {};
      console.log(`✅ API Success:`, data);
      return data;
    } catch (e) {
      console.log(`✅ API Success (non-JSON):`, responseText);
      return responseText;
    }
    
  } catch (error) {
    console.error("🚨 Network/Fetch Error:", error);
    throw error;
  }
}

// ---------- Interfaces ----------
export interface User {
  id: number;
  name: string;
  email?: string;
  mobile?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

export interface LoginResponse {
  message: string;
  user_id: number;
}

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
  console.log("📦 POST Data:", data);
  return request(endpoint, { 
    method: "POST", 
    body: JSON.stringify(data) 
  });
}

export const api = {
  // Authentication
  register: (data: { name: string; email?: string; mobile?: string }): Promise<RegisterResponse> => {
    console.log("👤 Register called with:", data);
    return post("auth/register", data);
  },
  
  login: (data: { email?: string; mobile?: string }): Promise<LoginResponse> => {
    console.log("🔐 Login called with:", data);
    return post("auth/login", data);
  },
  
  verifyOTP: (data: { user_id: number; otp: string }): Promise<AuthResponse> => {
    console.log("✅ Verify OTP called with:", data);
    return post("auth/verify-otp", data);
  },

  // Token management
  setToken,
  getToken,
  removeToken,
  isAuthenticated: () => !!getToken(),

  // Customers
  getCustomers: () => get("customers"),
  addCustomer: (data: any) => post("customers", data),
  getCustomer: (id: number): Promise<CustomerDetail> => 
    get(`customers/${id}`),
  getCustomerReceipts: (customerId: number): Promise<ReceiptDetail[]> => 
    get(`receipts?customer_id=${customerId}`),

   deleteCustomer: (id: number) => {
    console.log(`🗑️ Deleting customer ${id}`);
    return request(`customers/${id}`, { method: "DELETE" });
  },

  // Products
  getProducts: () => get("products"),
  addProduct: (data: any) => post("products", data),
  getProduct: (id: number): Promise<any> => 
    get(`products/${id}`),

  // Receipts - FIXED ENDPOINTS
  getReceipts: (): Promise<ReceiptDetail[]> => get("receipts"),
  getReceipt: (id: number): Promise<ReceiptDetail> => 
    get(`receipts/${id}`),
  getTopReceipts: () => get("dashboard/top-receipts"),
  getTopCustomers: (): Promise<TopCustomer[]> => 
    get("dashboard/top-customers"),
  getDashboardStats: (): Promise<DashboardStats> => 
    get("dashboard/stats"),

// Update the addReceipt function in api.ts:
addReceipt: (data: any) => {
  console.log("📝 Add Receipt with data:", data);
  
  // Your backend expects this exact structure
  const backendData = {
    date: data.date,
    due_date: data.due_date,
    status: data.status,
    amount: data.amount,  // This is total amount (price × quantity)
    advance_received: data.advance_received,
    customer_id: data.customer_id,
    product_id: data.product_id,
    quantity: data.quantity
  };
  
  console.log("🔄 Sending to backend:", backendData);
  
  return request("receipts", {
    method: "POST",
    body: JSON.stringify(backendData),
  });
},

  // Upload receipt image
// Add to the api object in api.ts:
uploadReceiptImage: async (file: File) => {
  console.log("📸 Upload receipt image:", file.name);
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BASE_URL}/receipts/upload-image`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Upload Error ${response.status}:`, errorText);
    throw new Error(`Upload Error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ Upload success:", result);
  
  // Return both the result and the file for further processing
  return {
    ...result,
    file: file
  };
},

// Add this function to extract dummy data from scanned receipt
extractReceiptData: async (file: File): Promise<any> => {
  console.log("🔍 Extracting data from receipt image...");
  
  // Simulate OCR processing - in real app, you would send to OCR API
  // For now, return dummy data that matches your mock structure
  
  // Generate a random ID for the scanned receipt
  const receiptId = Math.floor(Math.random() * 1000) + 100;
  
  // Dummy data based on your mock structure
  const dummyData = {
    id: receiptId,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: Math.floor(Math.random() * 5) + 1,
    advance_received: Math.floor(Math.random() * 100) + 10,
    customer_id: Math.floor(Math.random() * 3) + 1, // 1-3 based on your mock customers
    amount: Math.floor(Math.random() * 500) + 50,
    total_due: Math.floor(Math.random() * 400) + 20,
    status: "Open",
    product_id: 1, // Default product
    customer_name: ["John Foe", "shivam", "test1"][Math.floor(Math.random() * 3)],
    product_name: "Sample Product",
    product_price: Math.floor(Math.random() * 100) + 10
  };
  
  console.log("📄 Generated dummy data:", dummyData);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    data: dummyData,
    message: "Receipt data extracted successfully",
    is_new: true // Flag to indicate this is a new scanned receipt
  };
},

  // New: Check API connectivity
  checkApiHealth: () => get(""),
  
  // New: Test receipt endpoint specifically
  testReceiptEndpoint: () => get("receipts"),
};