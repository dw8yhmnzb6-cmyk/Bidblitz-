import React from "react";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: "📷", label: "Scan", path: "/scan" },
    { icon: "💳", label: "Pay", path: "/bidblitz-pay" },
    { icon: "⛏️", label: "Mining", path: "/mining" },
    { icon: "🚕", label: "Ride", path: "/taxi" },
    { icon: "💸", label: "Send", path: "/transfer" },
    { icon: "🛍️", label: "Shop", path: "/shop" },
  ];

  return (
    <div className="bg-slate-800 text-white p-4 rounded-2xl">
      
      <h3 className="text-lg font-bold mb-4">Quick Actions</h3>

      <div className="grid grid-cols-6 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl text-center transition"
            data-testid={`quick-action-${action.label.toLowerCase()}`}
          >
            <div className="text-xl mb-1">{action.icon}</div>
            <p className="text-[10px]">{action.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
