import React from "react";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: "🎮", label: "Spiele", path: "/games" },
    { icon: "⛏️", label: "Mining", path: "/miner" },
    { icon: "🛒", label: "Shop", path: "/store" },
    { icon: "👥", label: "Freunde", path: "/friends" },
    { icon: "🎁", label: "Rewards", path: "/rewards" },
    { icon: "⚙️", label: "Settings", path: "/settings" },
  ];

  return (
    <div className="bg-slate-800 text-white p-4 rounded-2xl">
      
      <h3 className="text-lg font-bold mb-4">Quick Actions</h3>

      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-center transition"
          >
            <div className="text-2xl mb-1">{action.icon}</div>
            <p className="text-xs">{action.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
