import React from "react";
import { useNavigate } from "react-router-dom";

export default function RideServices() {
  const navigate = useNavigate();

  const services = [
    {
      name: "Taxi",
      icon: "🚕",
      price: "ab 50 Coins",
      color: "from-yellow-500 to-orange-500",
      path: "/taxi",
    },
    {
      name: "Scooter",
      icon: "🛴",
      price: "ab 20 Coins",
      color: "from-green-500 to-emerald-600",
      path: "/scooter",
    },
    {
      name: "Bike",
      icon: "🚲",
      price: "ab 10 Coins",
      color: "from-blue-500 to-indigo-600",
      path: "/bike",
    },
  ];

  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl">

      <h2 className="text-xl font-bold mb-4">Fahrdienste</h2>

      <div className="grid grid-cols-3 gap-4">
        {services.map((service) => (
          <button
            key={service.name}
            onClick={() => navigate(service.path)}
            className={`bg-gradient-to-r ${service.color} p-4 rounded-xl shadow-lg hover:scale-105 transition`}
          >
            <div className="text-3xl">{service.icon}</div>
            <p className="font-semibold mt-2">{service.name}</p>
            <p className="text-xs opacity-80">{service.price}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
