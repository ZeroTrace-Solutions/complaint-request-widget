import React from "react";
import { createRoot } from "react-dom/client";
import { ComplaintRequestWidget } from "@zerotrace-solutions/complaint-request-widget";
import "./theme.css";

function App() {
  return (
    <div style={{ minHeight: "160vh", padding: "24px", fontFamily: "ui-sans-serif, system-ui" }}>
      <h1>Example Host App</h1>
      <p>Scroll and click around, then use the floating widget to select elements and send complaint payloads.</p>
      <button style={{ marginTop: "24px", padding: "12px 16px" }}>Checkout Button</button>

      <ComplaintRequestWidget
        whatsappUrl="https://wa.me/201000000000"
        requestAdapter={async (payload) => {
          console.log("Complaint payload", payload);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
