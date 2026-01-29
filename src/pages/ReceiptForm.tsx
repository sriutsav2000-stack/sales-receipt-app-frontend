import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonToast,
  IonButton,
  useIonRouter,
  IonLoading
} from "@ionic/react";
import { api } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRupeeSign, faCalendarAlt, faUser, faBox, 
  faSearch, faArrowLeft, faShoppingCart, faDollarSign, 
  faReceipt, faPlus, faTrash, faCheckCircle, 
  faClock, faEdit, faEye, faCamera,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Navigation from "../components/Navigation";

interface Customer {
  id: number;
  name: string;
  contact?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface ReceiptFormProps {
  receiptId?: number;
  mode?: 'add' | 'view' | 'edit';
  dummyData?: any; // Changed to accept any format
  isFromCamera?: boolean;
}

const STORAGE_KEY = "add_receipt_form_data";

const ReceiptForm: React.FC<ReceiptFormProps> = ({ 
  receiptId, 
  mode = 'add',
  dummyData,
  isFromCamera = false
}) => {
  const router = useIonRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [quantity, setQuantity] = useState<number | "">(1);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "Open",
    amount: "0",
    advance_received: "",
    balance_due: "0"
  });

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalReceipt, setOriginalReceipt] = useState<any>(null);

  // Determine title and button text based on mode
  const getTitle = () => {
    if (isFromCamera && mode === 'edit') {
      return "Create from Camera Scan";
    }
    switch(mode) {
      case 'view': return "View Receipt";
      case 'edit': return "Edit Receipt";
      default: return "Create New Receipt";
    }
  };

  const getButtonText = () => {
    if (isSubmitting) {
      return mode === 'edit' ? "Updating..." : "Creating...";
    }
    if (isFromCamera && mode === 'edit') {
      return "Create Receipt";
    }
    return mode === 'edit' ? "Update Receipt" : "Create Receipt";
  };

  // Load data
  useEffect(() => {
    const initializeForm = async () => {
      setIsLoading(true);
      try {
        // Load customers and products first
        await loadCustomersAndProducts();
        
        // Then apply data based on mode
        if (dummyData) {
          console.log("📊 Applying dummy data:", dummyData);
          await applyDummyData(dummyData);
        } else if (receiptId && (mode === 'view' || mode === 'edit')) {
          await loadReceiptData();
        } else if (mode === 'add') {
          // Load session data for add mode
          loadSessionData();
        }
        
      } catch (error) {
        console.error("Error initializing form:", error);
        setToastMessage("Failed to initialize form data");
        setShowToast(true);
      } finally {
        setIsLoading(false);
        setIsDataLoaded(true);
      }
    };

    initializeForm();
  }, [receiptId, mode, dummyData]);

  // Save to sessionStorage (only for add mode)
  useEffect(() => {
    if (mode === 'add' && isDataLoaded) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          formData,
          customerSearch,
          selectedCustomerId,
          productSearch,
          quantity,
          selectedProductId: selectedProduct?.id,
          selectedProductName: selectedProduct?.name,
          selectedProductPrice: selectedProduct?.price
        })
      );
    }
  }, [formData, customerSearch, selectedCustomerId, productSearch, quantity, selectedProduct, mode, isDataLoaded]);

  const loadSessionData = () => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const d = JSON.parse(saved);
      
      setFormData(
        d.formData || {
          date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "Open",
          amount: "0",
          advance_received: "",
          balance_due: "0"
        }
      );
      
      setCustomerSearch(d.customerSearch || "");
      setSelectedCustomerId(d.selectedCustomerId || null);
      setProductSearch(d.productSearch || "");
      setQuantity(d.quantity || 1);
      
      if (d.selectedProductId && d.selectedProductName && d.selectedProductPrice) {
        const product = products.find(p => p.id === d.selectedProductId);
        if (product) {
          setSelectedProduct(product);
        }
      }
    }
  };

  const applyDummyData = async (data: any) => {
    console.log("🔄 Setting form with data:", data);
    
    // Update form data
    const updatedFormData = { ...formData };
    
    if (data.date) {
      updatedFormData.date = data.date;
    }
    
    if (data.due_date) {
      updatedFormData.due_date = data.due_date;
    }
    
    if (data.status) {
      updatedFormData.status = data.status;
    }
    
    if (data.amount) {
      updatedFormData.amount = data.amount.toString();
    }
    
    if (data.advance_received !== undefined) {
      updatedFormData.advance_received = data.advance_received.toString();
      const total = parseFloat(updatedFormData.amount) || 0;
      const advance = data.advance_received || 0;
      updatedFormData.balance_due = Math.max(0, total - advance).toFixed(2);
    }
    
    if (data.total_due !== undefined) {
      updatedFormData.balance_due = data.total_due.toString();
    }
    
    setFormData(updatedFormData);
    
    // Set customer
    if (data.customer_id) {
      setSelectedCustomerId(data.customer_id);
      
      // Find and set customer name
      const customer = customers.find(c => c.id === data.customer_id);
      if (customer) {
        setCustomerSearch(customer.name);
      } else if (data.customer_name) {
        setCustomerSearch(data.customer_name);
      }
    }
    
    // Set product
    if (data.product_id) {
      const product = products.find(p => p.id === data.product_id);
      if (product) {
        setSelectedProduct(product);
        setProductSearch(product.name);
      } else if (data.product_name) {
        // Create a temporary product object
        const tempProduct: Product = {
          id: data.product_id,
          name: data.product_name,
          price: data.product_price || 0
        };
        setSelectedProduct(tempProduct);
        setProductSearch(data.product_name);
      }
    }
    
    // Set quantity
    if (data.quantity) {
      setQuantity(data.quantity);
    }
    
    // Set original receipt for reference
    if (data.id) {
      setOriginalReceipt(data);
    }
  };

  const loadReceiptData = async () => {
    if (!receiptId) return;
    
    try {
      console.log(`📥 Loading receipt ${receiptId}...`);
      const receipt = await api.getReceipt(receiptId);
      setOriginalReceipt(receipt);
      
      // Load customer and product details
      const [customerData, productData] = await Promise.all([
        api.getCustomer(receipt.customer_id).catch(() => ({ name: 'Unknown Customer' })),
        api.getProduct(receipt.product_id).catch(() => ({ name: 'Unknown Product', price: 0 }))
      ]);
      
      const enhancedReceipt = {
        ...receipt,
        customer_name: customerData.name,
        product_name: productData.name,
        product_price: productData.price || 0
      };
      
      await applyDummyData(enhancedReceipt);
      
    } catch (err) {
      console.error("❌ Failed to load receipt:", err);
      setToastMessage("Failed to load receipt data.");
      setShowToast(true);
    }
  };

  const loadCustomersAndProducts = async () => {
    try {
      console.log("📥 Loading customers and products...");
      const [cust, prod] = await Promise.all([
        api.getCustomers().catch(() => []),
        api.getProducts().catch(() => [])
      ]);

      console.log("✅ Loaded:", { customers: cust.length, products: prod.length });
      setCustomers(cust);
      setProducts(prod);
      
    } catch (err) {
      console.error("❌ Failed to load:", err);
      setToastMessage("Failed to load customer/product list.");
      setShowToast(true);
    }
  };

  // Recalculate totals when product or quantity changes
  useEffect(() => {
    if (selectedProduct && quantity && quantity > 0) {
      const total = selectedProduct.price * quantity;
      const advance = parseFloat(formData.advance_received) || 0;
      const balance = Math.max(0, total - advance);
      
      setFormData(prev => ({ 
        ...prev, 
        amount: total.toString(),
        balance_due: balance.toFixed(2)
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        amount: "0",
        balance_due: "0"
      }));
    }
  }, [selectedProduct, quantity, formData.advance_received]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'view') {
      // Switch to edit mode
      router.push(`/edit-receipt/${receiptId}`);
      return;
    }
    
    setIsSubmitting(true);

    // Validation
    if (!selectedCustomerId) {
      setToastMessage("❌ Please select a customer");
      setShowToast(true);
      setIsSubmitting(false);
      return;
    }

    if (!selectedProduct) {
      setToastMessage("❌ Please select a product");
      setShowToast(true);
      setIsSubmitting(false);
      return;
    }

    if (!quantity || quantity < 1) {
      setToastMessage("❌ Please enter a valid quantity (min: 1)");
      setShowToast(true);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("📤 Submitting receipt...");
      
      // Parse amounts
      const amount = parseFloat(formData.amount) || 0;
      const advance_received = parseFloat(formData.advance_received) || 0;

      const payload = {
        date: formData.date,
        due_date: formData.due_date,
        status: formData.status,
        amount: amount,
        advance_received: advance_received,
        customer_id: selectedCustomerId,
        product_id: selectedProduct.id,
        quantity: quantity
      };

      console.log("📦 Payload to backend:", payload);

      let result;
      if (mode === 'edit' && originalReceipt && !isFromCamera) {
        // Update existing receipt
        result = await updateReceipt(originalReceipt.id, payload);
      } else {
        // Add new receipt (including from camera scan)
        result = await api.addReceipt(payload);
      }
      
      console.log(`✅ Receipt ${mode === 'edit' && !isFromCamera ? 'updated' : 'added'}:`, result);

      // Clear storage if adding new
      if (mode === 'add' || isFromCamera) {
        sessionStorage.removeItem(STORAGE_KEY);
      }

      // Reset form for add mode
      if (mode === 'add' || isFromCamera) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "Open",
          amount: "0",
          advance_received: "",
          balance_due: "0"
        });
        setCustomerSearch("");
        setSelectedCustomerId(null);
        setProductSearch("");
        setSelectedProduct(null);
        setQuantity(1);
      }

      setToastMessage(`🎉 Receipt ${mode === 'edit' && !isFromCamera ? 'updated' : 'created'} successfully!`);
      setShowToast(true);

      // Redirect after delay
      setTimeout(() => {
        if (mode === 'edit' && !isFromCamera && receiptId) {
          router.push(`/view-receipt/${receiptId}`);
        } else if (result && result.id) {
          router.push(`/view-receipt/${result.id}`);
        } else {
          router.push('/receipts');
        }
      }, 1500);

    } catch (err: any) {
      console.error(`❌ ${mode === 'edit' && !isFromCamera ? 'Update' : 'Add'} receipt error:`, err);
      
      let errorMsg = `Failed to ${mode === 'edit' && !isFromCamera ? 'update' : 'add'} receipt.`;
      if (err.message.includes("422")) {
        errorMsg = "Validation error. Please check your inputs.";
      } else if (err.message.includes("401")) {
        errorMsg = "Authentication failed. Please login again.";
        setTimeout(() => router.push('/'), 2000);
      } else if (err.message.includes("Network")) {
        errorMsg = "Network error. Check if backend is running.";
      }
      
      setToastMessage(`❌ ${errorMsg}`);
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReceipt = async (id: number, data: any) => {
    const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/receipts/${id}`;
    const token = api.getToken();
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  };

  const goToAddCustomer = () => router.push("/add-customer");
  const goToAddProduct = () => router.push("/add-product");

  // Handle advance received change with better UX
  const handleAdvanceChange = (value: string) => {
    // Allow empty string for backspace
    if (value === "") {
      setFormData(prev => ({ 
        ...prev, 
        advance_received: "",
        balance_due: prev.amount
      }));
      return;
    }
    
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) return; // Invalid input
    
    // Parse as number
    const advance = parseFloat(cleanValue);
    if (isNaN(advance)) return;
    
    const total = parseFloat(formData.amount) || 0;
    
    // Ensure advance doesn't exceed total
    const validAdvance = Math.min(advance, total);
    
    // Calculate balance
    const balance = Math.max(0, total - validAdvance);
    
    setFormData(prev => ({ 
      ...prev, 
      advance_received: validAdvance.toString(),
      balance_due: balance.toFixed(2)
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (value: string) => {
    if (value === "") {
      setQuantity("");
      return;
    }
    
    const qty = parseInt(value);
    if (!isNaN(qty) && qty > 0) {
      setQuantity(qty);
    }
  };

  // Format advance on blur
  const handleAdvanceBlur = () => {
    if (formData.advance_received && !isNaN(parseFloat(formData.advance_received))) {
      const formatted = parseFloat(formData.advance_received).toFixed(2);
      setFormData(prev => ({
        ...prev,
        advance_received: formatted
      }));
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCustomerDropdown(false);
      setShowProductDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Check if form is editable
  const isEditable = mode !== 'view';

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <Navigation title={getTitle()} />
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            {isFromCamera ? (
              <>
                <div className="scanner-animation">
                  <div className="scanner-beam"></div>
                  <div className="document-icon">📄</div>
                </div>
                <h4 className="mt-4">Processing Scanned Receipt</h4>
                <p className="text-muted">Extracting data from your photo...</p>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary mb-3" />
                <p className="mt-3 text-muted">Loading receipt data...</p>
              </>
            )}
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <Navigation title={getTitle()} />
      </IonHeader>

      <IonContent className="ion-padding">
        {isFromCamera && (
          <div className="scanned-receipt-header">
            <div className="scan-info-banner">
              <div className="scan-icon">
                <FontAwesomeIcon icon={faCamera} />
              </div>
              <div>
                <h5>Scanned Receipt</h5>
                <p className="mb-0">Data extracted from camera. Please review and edit below.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="container-fluid fade-in-up">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10 col-xl-8">
              <div className="elegant-card p-4 p-md-5 mb-4">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                  <div className={`bg-${mode === 'view' ? 'secondary' : isFromCamera ? 'info' : 'primary'} bg-gradient p-3 rounded-circle me-3`}>
                    <FontAwesomeIcon 
                      icon={mode === 'view' ? faEye : isFromCamera ? faCamera : mode === 'edit' ? faEdit : faReceipt} 
                      className="text-white" 
                      size="lg" 
                    />
                  </div>
                  <div>
                    <h1 className="h3 fw-bold mb-1 gradient-text">{getTitle()}</h1>
                    <p className="text-muted mb-0">
                      {mode === 'view' 
                        ? 'View receipt details' 
                        : isFromCamera
                          ? 'Review extracted data from camera scan'
                          : mode === 'edit' 
                            ? 'Edit receipt details' 
                            : 'Fill in the details to generate a receipt'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Dates Section */}
                  <div className="row mb-4">
                    <div className="col-12 col-md-6 mb-3 mb-md-0">
                      <label className="form-label fw-semibold mb-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                        Issue Date
                      </label>
                      <div className="input-group">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                          disabled={!isEditable}
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold mb-2">
                        <FontAwesomeIcon icon={faClock} className="me-2" />
                        Due Date
                      </label>
                      <div className="input-group">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={formData.due_date}
                          onChange={(e) =>
                            setFormData({ ...formData, due_date: e.target.value })
                          }
                          required
                          disabled={!isEditable}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Search */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Customer <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FontAwesomeIcon icon={faSearch} />
                        </span>
                        <input
                          className="form-control"
                          placeholder="Search customer by name..."
                          value={customerSearch}
                          onFocus={() => setShowCustomerDropdown(true)}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={!isEditable}
                          readOnly={mode === 'view'}
                        />
                        {isEditable && (
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button"
                            onClick={goToAddCustomer}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                        )}
                      </div>

                      {isEditable && showCustomerDropdown && customerSearch.trim() !== "" && (
                        <div className="dropdown-menu show w-100 mt-1 shadow" onClick={handleDropdownClick}>
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((cust) => (
                              <button
                                key={cust.id}
                                type="button"
                                className="dropdown-item d-flex justify-content-between align-items-center py-3"
                                onClick={() => {
                                  setCustomerSearch(cust.name);
                                  setSelectedCustomerId(cust.id);
                                  setShowCustomerDropdown(false);
                                }}
                              >
                                <span>{cust.name}</span>
                                <small className="text-muted">{cust.contact || 'No contact'}</small>
                              </button>
                            ))
                          ) : (
                            <div className="dropdown-item text-muted py-3 text-center">
                              No results found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedCustomerId && (
                      <div className="mt-2">
                        <span className="badge bg-primary bg-gradient">
                          Selected: {customers.find(c => c.id === selectedCustomerId)?.name || customerSearch || 'Loading...'}
                        </span>
                      </div>
                    )}
                    {!selectedCustomerId && (
                      <small className="text-danger">Please select a customer</small>
                    )}
                  </div>

                  {/* Product Selection */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label fw-semibold mb-0">
                        <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                        Product <span className="text-danger">*</span>
                      </label>
                      {selectedProduct && (
                        <span className="badge bg-primary bg-gradient">
                          Price: ₹{selectedProduct.price}
                        </span>
                      )}
                    </div>

                    <div className="position-relative mb-3">
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <FontAwesomeIcon icon={faBox} />
                        </span>
                        <input
                          className="form-control"
                          placeholder="Search and select a product..."
                          value={productSearch}
                          onFocus={() => setShowProductDropdown(true)}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={!isEditable}
                          readOnly={mode === 'view'}
                        />
                        {isEditable && (
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button"
                            onClick={goToAddProduct}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                        )}
                      </div>

                      {isEditable && showProductDropdown && productSearch.trim() !== "" && (
                        <div className="dropdown-menu show w-100 mt-1 shadow" onClick={handleDropdownClick}>
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className="dropdown-item d-flex justify-content-between align-items-center py-2"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setProductSearch(product.name);
                                  setShowProductDropdown(false);
                                }}
                              >
                                <span>{product.name}</span>
                                <small className="text-muted">₹{product.price.toFixed(2)}</small>
                              </button>
                            ))
                          ) : (
                            <div className="dropdown-item text-muted py-2 text-center">
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedProduct && (
                      <div className={`alert ${isEditable ? 'alert-success' : 'alert-info'} d-flex justify-content-between align-items-center`}>
                        <div>
                          <strong>{selectedProduct.name}</strong>
                          <div className="text-muted small">Price: ₹{selectedProduct.price.toFixed(2)}</div>
                        </div>
                        {isEditable && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => {
                              setSelectedProduct(null);
                              setProductSearch("");
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Quantity Input */}
                    <div className="mt-3">
                      <label className="form-label fw-semibold">
                        Quantity <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">Qty</span>
                        <input
                          type="number"
                          className="form-control"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          min="1"
                          step="1"
                          required
                          disabled={!selectedProduct || !isEditable}
                          readOnly={mode === 'view'}
                        />
                        <span className="input-group-text bg-light">Units</span>
                      </div>
                      {selectedProduct && quantity && quantity > 0 && (
                        <div className="mt-2 text-end">
                          <small className="text-muted">
                            Unit Price: ₹{selectedProduct.price.toFixed(2)} × {quantity} = 
                            <span className="fw-bold text-primary"> ₹{(selectedProduct.price * quantity).toFixed(2)}</span>
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Totals Section */}
                  <div className="elegant-card p-4 mb-4 bg-gradient-primary text-white">
                    <h5 className="fw-bold mb-4 text-center">
                      <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                      Payment Summary
                    </h5>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label small text-black-50 mb-1">Total Amount</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-0">
                            <FontAwesomeIcon icon={faRupeeSign} />
                          </span>
                          <input
                            type="text"
                            className="form-control border-0 bg-white fw-bold"
                            value={formData.amount}
                            readOnly
                          />
                          <span className="input-group-text bg-white border-0 fw-bold">
                            ₹
                          </span>
                        </div>
                        <small className="text-black-50">Price × Quantity</small>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small text-black-50 mb-1">Advance Received</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-0">
                            <FontAwesomeIcon icon={faRupeeSign} />
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="form-control border-0"
                            value={formData.advance_received}
                            onChange={(e) => handleAdvanceChange(e.target.value)}
                            onBlur={handleAdvanceBlur}
                            placeholder="0"
                            max={formData.amount}
                            disabled={!selectedProduct || !quantity || !isEditable}
                            readOnly={mode === 'view'}
                          />
                          <span className="input-group-text bg-white border-0 fw-bold">
                            ₹
                          </span>
                        </div>
                        <small className="text-black-50">
                          Max: ₹{formData.amount}
                        </small>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small text-black-50 mb-1">Balance Due</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-0">
                            <FontAwesomeIcon icon={faRupeeSign} />
                          </span>
                          <input
                            type="text"
                            className="form-control border-0 fw-bold"
                            value={formData.balance_due}
                            readOnly
                          />
                          <span className="input-group-text bg-white border-0 fw-bold">
                            ₹
                          </span>
                        </div>
                        <small className="text-black-50">Total - Advance</small>
                      </div>
                    </div>
                    
                    {/* Summary */}
                    <div className="mt-4 pt-3 border-top border-white border-opacity-25">
                      <div className="row">
                        <div className="col-6">
                          <div className="text-center">
                            <div className="small text-black-50">Product Selected</div>
                            <div className="h4 fw-bold">
                              {selectedProduct ? "✓" : "✗"}
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center">
                            <div className="small text-black-50">Advance %</div>
                            <div className="h4 fw-bold">
                              {parseFloat(formData.amount) > 0 
                                ? ((parseFloat(formData.advance_received || "0") / parseFloat(formData.amount)) * 100).toFixed(1) + '%'
                                : '0%'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-3">Status</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="statusOpen"
                          checked={formData.status === "Open"}
                          onChange={() =>
                            setFormData({ ...formData, status: "Open" })
                          }
                          disabled={!isEditable}
                        />
                        <label className="form-check-label" htmlFor="statusOpen">
                          <span className="d-flex align-items-center">
                            <span className="badge bg-warning bg-gradient me-2">●</span>
                            Open
                          </span>
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="statusClosed"
                          checked={formData.status === "Closed"}
                          onChange={() =>
                            setFormData({ ...formData, status: "Closed" })
                          }
                          disabled={!isEditable}
                        />
                        <label className="form-check-label" htmlFor="statusClosed">
                          <span className="d-flex align-items-center">
                            <span className="badge bg-success bg-gradient me-2">●</span>
                            Closed
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <button 
                        type="submit" 
                        className={`btn w-100 py-3 ${mode === 'view' ? 'btn-info' : isFromCamera ? 'btn-primary' : 'btn-success'}`}
                        disabled={isSubmitting || (mode !== 'view' && (!selectedCustomerId || !selectedProduct || !quantity))}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            {getButtonText()}
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon 
                              icon={mode === 'view' ? faEdit : faCheckCircle} 
                              className="me-2" 
                            />
                            {mode === 'view' ? 'Edit Receipt' : getButtonText()}
                          </>
                        )}
                      </button>
                    </div>
                    <div className="col-12 col-md-6">
                      <button 
                        type="button"
                        className="btn btn-secondary w-100 py-3"
                        onClick={() => {
                          if (mode === 'view' && receiptId) {
                            router.push('/receipts');
                          } else if (mode === 'edit' && receiptId && !isFromCamera) {
                            router.push(`/view-receipt/${receiptId}`);
                          } else {
                            router.push('/receipts');
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        {mode === 'view' ? 'Back to List' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={5000}
          onDidDismiss={() => setShowToast(false)}
          position="top"
          color={toastMessage.includes("❌") ? "danger" : toastMessage.includes("📸") ? "primary" : "success"}
        />
        
        <IonLoading
          isOpen={isSubmitting}
          message={mode === 'edit' && !isFromCamera ? "Updating receipt..." : "Creating receipt..."}
        />
      </IonContent>
    </IonPage>
  );
};

export default ReceiptForm;