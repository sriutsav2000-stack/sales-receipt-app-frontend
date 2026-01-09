// src/App.tsx
import { Route, Redirect } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Receipts from "./pages/Receipts";
import AddReceipt from "./pages/AddReceipt";
import AddCustomer from "./pages/AddCustomer";
import AddProduct from "./pages/AddProduct";
import UploadReceipt from "./pages/UploadReceipt";
import Home from "./pages/Home";
import CustomerDetail from "./pages/CustomerDetail";
import ReceiptDetail from "./pages/ReceiptDetail";
import Login from "./pages/Login";
import './styles/main.css';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Customers from "./pages/Customers";

setupIonicReact();

// Private Route Component
const PrivateRoute: React.FC<any> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/" />
        )
      }
    />
  );
};

const AppRoutes: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/" component={Login} />
          <PrivateRoute exact path="/home" component={Home} />
          <PrivateRoute exact path="/receipts" component={Receipts} />
          <PrivateRoute exact path="/add-receipt" component={AddReceipt} />
          <PrivateRoute exact path="/add-customer" component={AddCustomer} />
          <PrivateRoute exact path="/add-product" component={AddProduct} />
          <PrivateRoute exact path="/upload-receipt" component={UploadReceipt} />
          <PrivateRoute exact path="/customer/:id" component={CustomerDetail} />
          <PrivateRoute exact path="/receipt/:id" component={ReceiptDetail} />
           <PrivateRoute exact path="/customers" component={Customers} /> 
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;