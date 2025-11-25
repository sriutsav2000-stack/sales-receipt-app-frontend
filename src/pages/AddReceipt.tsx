// AddReceipt.tsx - Fixed immediate state update for product selection
import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonToast,
  IonButton,
  useIonRouter,
} from "@ionic/react";
import { api } from "../services/api";

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

interface ProductRow {
  product_id: number | null;
  product_name: string;
  quantity: number | null;
  price: number | null;
  show: boolean;
}

const STORAGE_KEY = "add_receipt_form_data";

const AddReceipt: React.FC = () => {
  const router = useIonRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );

  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [formData, setFormData] = useState({
    date: "",
    due_date: "",
    status: "Open",
    amount: "",
    advance_received: "",
  });

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Load from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const d = JSON.parse(saved);

      setFormData(
        d.formData || {
          date: "",
          due_date: "",
          status: "Open",
          amount: "",
          advance_received: "",
        }
      );

      setCustomerSearch(d.customerSearch || "");
      setSelectedCustomerId(d.selectedCustomerId || null);

      setProductRows(
        (d.productRows || []).map((row: any) => ({
          product_id: row.product_id ?? null,
          product_name: row.product_name ?? "",
          quantity: row.quantity ?? null,
          price: row.price ?? null,
          show: false,
        }))
      );
    }
  }, []);

  // Save to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        formData,
        customerSearch,
        selectedCustomerId,
        productRows,
      })
    );
  }, [formData, customerSearch, selectedCustomerId, productRows]);

  // Fetch customers + products
  useEffect(() => {
    const load = async () => {
      try {
        const [cust, prod] = await Promise.all([
          api.getCustomers(),
          api.getProducts(),
        ]);

        setCustomers(cust);
        setProducts(prod);
        console.log("Loaded products:", prod);
      } catch (err) {
        setToastMessage("Failed to load customer/product list.");
        setShowToast(true);
      }
    };

    load();
  }, []);

  // Add new product row
  const addProductRow = () => {
    setProductRows((prev) => [
      ...prev,
      {
        product_id: null,
        product_name: "",
        quantity: null,
        price: null,
        show: false,
      },
    ]);
  };

  const updateProductRow = (
    index: number,
    field: keyof ProductRow,
    value: any
  ) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], [field]: value };
    setProductRows(updated);
    recalc(updated);
  };

  const deleteProductRow = (index: number) => {
    const updated = productRows.filter((_, i) => i !== index);
    setProductRows(updated);
    recalc(updated);
  };

  const recalc = (rows: ProductRow[]) => {
    let total = 0;
    rows.forEach((r) => {
      if (r.price && r.quantity) total += r.price * r.quantity;
    });
    setFormData((prev) => ({ ...prev, amount: String(total || "") }));
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const items = productRows
        .filter((r) => r.product_id && r.quantity)
        .map((r) => ({
          product_id: r.product_id!,
          quantity: r.quantity!,
          price: r.price!,
        }));

      console.log("Submitting receipt with items:", items);

      await api.addReceipt({
        date: formData.date,
        due_date: formData.due_date,
        status: formData.status,
        amount: Number(formData.amount),
        advance_received: Number(formData.advance_received),
        customer_id: selectedCustomerId,
        items,
      });

      // Clear saved form
      sessionStorage.removeItem(STORAGE_KEY);

      // Reset fields
      setFormData({
        date: "",
        due_date: "",
        status: "Open",
        amount: "",
        advance_received: "",
      });
      setCustomerSearch("");
      setSelectedCustomerId(null);
      setProductRows([]);

      setToastMessage("Receipt added successfully!");
      setShowToast(true);
    } catch (err) {
      console.error("Error adding receipt:", err);
      setToastMessage("Failed to add receipt.");
      setShowToast(true);
    }
  };

  const goToAddCustomer = () => router.push("/add-customer");
  const goToAddProduct = () => router.push("/add-product");

  // FIXED: Direct product selection handler
  const handleProductSelect = (index: number, product: Product) => {
    console.log("Selecting product:", product, "for row:", index);
    
    // Create a new array with the updated row
    const updatedRows = productRows.map((row, i) => {
      if (i === index) {
        return {
          ...row,
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          show: false
        };
      }
      return row;
    });
    
    console.log("Updated rows:", updatedRows);
    setProductRows(updatedRows);
    recalc(updatedRows);
  };

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = () => {
      // Close customer dropdown
      if (showCustomerDropdown) {
        setShowCustomerDropdown(false);
      }

      // Close all product dropdowns
      const updatedRows = productRows.map(row => ({
        ...row,
        show: false
      }));
      setProductRows(updatedRows);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCustomerDropdown, productRows]);

  // Stop propagation for dropdown clicks
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleProductInputClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    // Close all other dropdowns and open this one
    const updatedRows = productRows.map((row, i) => ({
      ...row,
      show: i === index ? true : false
    }));
    setProductRows(updatedRows);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Receipt</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="form-container fade-in">
          <div className="form-card hover-lift">
            <h4 className="form-title">Create New Receipt</h4>

            <form onSubmit={handleSubmit}>
              {/* Date */}
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
              </div>

              {/* Customer Search */}
              <div className="form-group dropdown-container">
                <label className="form-label">Customer</label>
                <input
                  className="form-input"
                  placeholder="Search customer..."
                  value={customerSearch}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />

                {showCustomerDropdown && customerSearch.trim() !== "" && (
                  <div className="dropdown-menu" onClick={handleDropdownClick}>
                    {filteredCustomers.length ? (
                      filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          className="dropdown-item"
                          onClick={() => {
                            setCustomerSearch(cust.name);
                            setSelectedCustomerId(cust.id);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          {cust.name}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item text-muted">No results found</div>
                    )}

                    <div
                      className="dropdown-item add-new"
                      onClick={goToAddCustomer}
                    >
                      ➕ Add New Customer
                    </div>
                  </div>
                )}
              </div>

              {/* Product Rows - COMPLETELY FIXED */}
              <div className="form-group">
                <label className="form-label">Products</label>

                {productRows.map((row, index) => (
                  <div key={index} className="product-row slide-in">
                    <div className="product-search dropdown-container">
                      <input
                        className="form-input"
                        placeholder="Search product..."
                        value={row.product_name}
                        onFocus={() => {
                          console.log("Focus on product input, row:", index, "Current value:", row.product_name);
                          // Close all other dropdowns and open this one
                          const updatedRows = productRows.map((r, i) => ({
                            ...r,
                            show: i === index ? true : false
                          }));
                          setProductRows(updatedRows);
                        }}
                        onChange={(e) => {
                          console.log("Product search change:", e.target.value);
                          // Update only the product_name and keep dropdown open
                          const updatedRows = productRows.map((r, i) => ({
                            ...r,
                            product_name: i === index ? e.target.value : r.product_name,
                            show: i === index ? true : false
                          }));
                          setProductRows(updatedRows);
                        }}
                        onClick={(e) => handleProductInputClick(e, index)}
                      />

                      {row.show && (
                        <div className="dropdown-menu" onClick={handleDropdownClick}>
                          {products
                            .filter((p) =>
                              p.name.toLowerCase().includes(row.product_name.toLowerCase())
                            )
                            .map((prod) => (
                              <div
                                key={prod.id}
                                className="dropdown-item"
                                onClick={() => {
                                  console.log("Product clicked:", prod.name);
                                  handleProductSelect(index, prod);
                                }}
                              >
                                {prod.name} — ₹{prod.price}
                              </div>
                            ))}

                          {products.filter(p => 
                            p.name.toLowerCase().includes(row.product_name.toLowerCase())
                          ).length === 0 && (
                            <div className="dropdown-item text-muted">No products found</div>
                          )}

                          <div
                            className="dropdown-item add-new"
                            onClick={goToAddProduct}
                          >
                            ➕ Add New Product
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Qty */}
                    <div className="product-quantity">
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Qty"
                        value={row.quantity ?? ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          const updatedRows = productRows.map((r, i) => ({
                            ...r,
                            quantity: i === index ? value : r.quantity
                          }));
                          setProductRows(updatedRows);
                          recalc(updatedRows);
                        }}
                        min="1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProductRow(index);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <IonButton 
                  expand="block" 
                  color="secondary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    addProductRow();
                  }}
                  className="mt-3 custom-button secondary"
                  style={{ 
                    '--background': 'linear-gradient(135deg, var(--secondary), #eab308)',
                    '--background-hover': 'linear-gradient(135deg, #eab308, var(--secondary))'
                  } as any}
                >
                  ＋ Add a Product
                </IonButton>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">Total Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  readOnly
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Advance */}
              <div className="form-group">
                <label className="form-label">Advance Received</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.advance_received}
                  onChange={(e) =>
                    setFormData({ ...formData, advance_received: e.target.value })
                  }
                  required
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Submit */}
              <IonButton 
                type="submit" 
                expand="block" 
                color="primary" 
                className="mt-4 custom-button"
                style={{ 
                  '--background': 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  '--background-hover': 'linear-gradient(135deg, var(--primary-dark), var(--primary))'
                } as any}
                onClick={(e) => e.stopPropagation()}
              >
                Submit Receipt
              </IonButton>

              <IonButton 
                expand="block" 
                fill="clear" 
                color="medium" 
                routerLink="/receipts" 
                className="mt-2"
                style={{
                  '--color': 'var(--gray-600)',
                  '--color-hover': 'var(--primary)'
                } as any}
                onClick={(e) => e.stopPropagation()}
              >
                Back to Receipts
              </IonButton>
            </form>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddReceipt;