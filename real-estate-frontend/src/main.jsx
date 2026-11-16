import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // 👈 BrowserRouter ကို import လုပ်ပါ
import { Provider } from "react-redux";
import { store } from "./store"; // သင့် Redux store path အမှန်
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        {" "}
        {/* 👈 App တစ်ခုလုံးကို BrowserRouter ဖြင့် အုပ်ပေးရန် */}
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
