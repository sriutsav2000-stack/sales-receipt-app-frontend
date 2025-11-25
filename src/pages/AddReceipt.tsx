// AddReceipt.tsx — same functionality, ONLY persistence switched to sessionStorage
import React, { useEffect, useState } from "react";
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
      setToastMessage("Failed to add receipt.");
      setShowToast(true);
    }
  };

  const goToAddCustomer = () => router.push("/add-customer");
  const goToAddProduct = () => router.push("/add-product");

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Receipt</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        <div className="container mt-4">
          <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: "650px" }}>
            <h4 className="text-center text-primary">Create New Receipt</h4>

            <form onSubmit={handleSubmit}>

              {/* Date */}
              <div className="mb-3">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              {/* Due Date */}
              <div className="mb-3">
                <label>Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
              </div>

              {/* Customer Search */}
              <div className="mb-3 position-relative">
                <label>Customer</label>
                <input
                  className="form-control"
                  placeholder="Search customer..."
                  value={customerSearch}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                />

                {showCustomerDropdown && customerSearch.trim() !== "" && (
                  <div
                    className="dropdown-menu show w-100"
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {filteredCustomers.length ? (
                      filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          className="dropdown-item"
                          onMouseDown={() => {
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
                      className="dropdown-item text-primary fw-bold"
                      onMouseDown={goToAddCustomer}
                    >
                      ➕ Add New Customer
                    </div>
                  </div>
                )}
              </div>

              {/* Product Rows — unchanged so you can debug autocomplete */}
              <div className="mb-3">
                <label>Products</label>

                {productRows.map((row, index) => (
                  <div key={index} className="row mb-2">

                    <div className="col-7 position-relative">
                      <input
                        className="form-control"
                        placeholder="Search product..."
                        value={row.product_name}
                        onFocus={() => updateProductRow(index, "show", true)}
                        onChange={(e) => {
                          updateProductRow(index, "product_name", e.target.value);
                          updateProductRow(index, "show", true);
                        }}
                      />

                      {row.show && (
                        <div
                          className="dropdown-menu show w-100"
                          style={{ maxHeight: "200px", overflowY: "auto" }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {products
                            .filter((p) =>
                              p.name.toLowerCase().includes(row.product_name.toLowerCase())
                            )
                            .map((prod) => (
                              <div
                                key={prod.id}
                                className="dropdown-item"
                                onMouseDown={() => {
                                  updateProductRow(index, "product_name", prod.name);
                                  updateProductRow(index, "product_id", prod.id);
                                  updateProductRow(index, "price", prod.price);
                                  updateProductRow(index, "show", false);
                                }}
                              >
                                {prod.name} — ₹{prod.price}
                              </div>
                            ))}

                          <div
                            className="dropdown-item text-primary fw-bold"
                            onMouseDown={goToAddProduct}
                          >
                            ➕ Add New Product
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Qty */}
                    <div className="col-3">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Qty"
                        value={row.quantity ?? ""}
                        onChange={(e) =>
                          updateProductRow(index, "quantity", Number(e.target.value))
                        }
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-2 d-flex align-items-center">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => deleteProductRow(index)}
                      >
                        ✕
                      </button>
                    </div>

                  </div>
                ))}

                <IonButton expand="block" color="secondary" onClick={addProductRow}>
                  Add a Product
                </IonButton>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label>Total Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>

              {/* Advance */}
              <div className="mb-3">
                <label>Advance Received</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.advance_received}
                  onChange={(e) =>
                    setFormData({ ...formData, advance_received: e.target.value })
                  }
                  required
                />
              </div>

              {/* Status */}
              <div className="mb-3">
                <label>Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Submit */}
              <IonButton type="submit" expand="block" color="primary">
                Submit Receipt
              </IonButton>

              <IonButton expand="block" fill="clear" routerLink="/receipts">
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
