"use client";

import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";

/**
 * Vista completa de checkout. Ya no lee "cartProducts" directamente:
 * OrderSummary obtiene el carrito real desde CartContext (useCart),
 * así que refleja exactamente lo que el usuario dejó en SideListProducts.
 */
export default function CheckoutView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2">
      <CheckoutForm />
      <OrderSummary />
    </div>
  );
}