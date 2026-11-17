import React from "react";

const CustomModal = ({ isOpen, title, message, type = "error", onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-center transform transition-all scale-100">
        {/* Icon Header */}
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl shadow-inner ${
            type === "error"
              ? "bg-red-50 text-red-500 border border-red-100"
              : type === "success"
                ? "bg-emerald-50 text-emerald-500 border border-emerald-100"
                : "bg-amber-50 text-amber-500 border border-amber-100"
          }`}
        >
          {type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️"}
        </div>

        {/* Title */}
        <h3 className="text-lg font-extrabold text-slate-800 mb-2">
          {title || (type === "error" ? "ခွင့်ပြုချက် မရှိပါ" : "အသိပေးချက်")}
        </h3>

        {/* Message */}
        <p className="text-sm text-slate-600 leading-relaxed mb-6 px-2">
          {message}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-3 px-6 rounded-2xl text-sm font-bold text-white shadow-lg transition active:scale-95 ${
            type === "error"
              ? "bg-red-600 hover:bg-red-700 shadow-red-200"
              : type === "success"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
          }`}
        >
          နားလည်ပါပြီ / ပိတ်မည်
        </button>
      </div>
    </div>
  );
};

export default CustomModal;
