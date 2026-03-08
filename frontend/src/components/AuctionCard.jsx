import React from "react";
import { useNavigate } from "react-router-dom";

export default function AuctionCard({ auction }) {
  const navigate = useNavigate();

  const {
    id,
    title = "Produkt",
    image = "📦",
    currentBid = 0,
    timeLeft = "00:00",
    bidCount = 0,
  } = auction || {};

  return (
    <div className="bg-slate-800 text-white rounded-2xl overflow-hidden shadow-lg">
      
      {/* Image */}
      <div className="bg-slate-700 h-32 flex items-center justify-center text-5xl">
        {typeof image === "string" && image.startsWith("http") ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          image
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg truncate">{title}</h3>
        
        <div className="flex justify-between items-center mt-3">
          <div>
            <p className="text-xs text-slate-400">Aktuelles Gebot</p>
            <p className="text-xl font-bold text-green-400">{currentBid} €</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Verbleibend</p>
            <p className="text-lg font-mono text-amber-400">{timeLeft}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-slate-400">{bidCount} Gebote</span>
          <button
            onClick={() => navigate(`/auction/${id}`)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            Bieten
          </button>
        </div>
      </div>
    </div>
  );
}
