import React from "react";
import { useNavigate } from "react-router-dom";

export default function WalletCard({ balance = 0, coins = 0 }) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-2xl shadow-lg">
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm opacity-80">Guthaben</p>
          <p className="text-3xl font-bold">{balance.toLocaleString()} €</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">Coins</p>
          <p className="text-2xl font-bold">{coins.toLocaleString()} 🪙</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate("/wallet/deposit")}
          className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-xl font-medium transition"
        >
          + Einzahlen
        </button>
        <button
          onClick={() => navigate("/wallet/withdraw")}
          className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-xl font-medium transition"
        >
          Auszahlen
        </button>
      </div>
    </div>
  );
}
