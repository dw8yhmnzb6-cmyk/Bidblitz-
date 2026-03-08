import React from "react";

export default function RewardsPanel({ streak = 0, nextReward = 10, claimed = false, onClaim }) {
  
  const rewards = [5, 10, 15, 25, 50, 100, 200];

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-2xl">
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold">🔥 Tägliche Belohnung</h3>
          <p className="text-sm opacity-90">Streak: {streak} Tage</p>
        </div>
        <button
          onClick={onClaim}
          disabled={claimed}
          className={`px-5 py-2 rounded-xl font-bold transition ${
            claimed
              ? "bg-white/30 cursor-not-allowed"
              : "bg-white text-amber-600 hover:bg-amber-100"
          }`}
        >
          {claimed ? "✓ Abgeholt" : `+${nextReward} Coins`}
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {rewards.map((reward, idx) => (
          <div
            key={idx}
            className={`flex-1 py-2 rounded-lg text-center text-xs font-medium ${
              idx < streak
                ? "bg-white/40"
                : idx === streak && !claimed
                ? "bg-white text-amber-600 animate-pulse"
                : "bg-white/20"
            }`}
          >
            {reward}
          </div>
        ))}
      </div>
    </div>
  );
}
