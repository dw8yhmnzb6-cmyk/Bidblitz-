import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNavBar(){

  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {icon:"🏠", label:"Home", path:"/home"},
    {icon:"🎮", label:"Games", path:"/games"},
    {icon:"⛏", label:"Mining", path:"/miner"},
    {icon:"💰", label:"Wallet", path:"/wallet"},
    {icon:"👤", label:"Profile", path:"/profile"}
  ]

  return(

    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700">

      <div className="flex justify-around py-3">

        {tabs.map((tab)=>(

          <button
            key={tab.label}
            onClick={()=>navigate(tab.path)}
            className={`flex flex-col items-center transition ${
              location.pathname === tab.path 
                ? "text-purple-400" 
                : "text-slate-400 hover:text-white"
            }`}
          >

            <span className="text-2xl">{tab.icon}</span>
            <span className="text-xs mt-1">{tab.label}</span>

          </button>

        ))}

      </div>

    </div>

  )

}
