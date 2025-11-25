import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Receipts from "./pages/Receipts";
import AddReceipt from "./pages/AddReceipt";
import AddCustomer from "./pages/AddCustomer";
import AddProduct from "./pages/AddProduct";
import './styles/main.css';

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/receipts" component={Receipts} />
        <Route exact path="/add-receipt" component={AddReceipt} />
        <Route exact path="/add-customer" component={AddCustomer} />
        <Route exact path="/add-product" component={AddProduct} />
        <Redirect exact from="/" to="/receipts" />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;