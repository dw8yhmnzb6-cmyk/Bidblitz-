import React from "react";

export default function BidBlitzDashboard(){

const modules = [

{icon:"💰",name:"Wallet",link:"/wallet"},
{icon:"⛏",name:"Mining",link:"/miner"},
{icon:"🎮",name:"Games",link:"/games"},
{icon:"🚕",name:"Taxi",link:"/ride/taxi"},
{icon:"🛴",name:"Scooter",link:"/ride/scooter"},
{icon:"🚲",name:"Bike",link:"/ride/bike"},
{icon:"🛒",name:"Marketplace",link:"/market"},
{icon:"⚙️",name:"Admin",link:"/admin"}

]

return(

<div className="bg-slate-900 text-white min-h-screen p-6">

{/* HEADER */}

<div className="mb-6">

<h1 className="text-3xl font-bold">
BidBlitz Super App
</h1>

<p className="opacity-70">
All Services in One App
</p>

</div>


{/* MODULE GRID */}

<div className="grid grid-cols-4 gap-4">

{modules.map((m)=>(

<button
key={m.name}
onClick={()=>window.location.href=m.link}
className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-center transition"
>

<div className="text-3xl">
{m.icon}
</div>

<p className="text-sm mt-2">
{m.name}
</p>

</button>

))}

</div>

</div>

)

}
