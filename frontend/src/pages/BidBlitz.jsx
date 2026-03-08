import React from "react";

export default function BidBlitz(){

const modules = [

{icon:"💰",title:"Wallet"},
{icon:"⛏",title:"Mining"},
{icon:"🎮",title:"Games"},
{icon:"🚕",title:"Taxi"},
{icon:"🛴",title:"Scooter"},
{icon:"🚲",title:"Bike"},
{icon:"🛒",title:"Market"},
{icon:"⚙️",title:"Admin"}

]

return(

<div className="min-h-screen bg-gradient-to-b from-purple-700 to-slate-900 text-white p-6">

{/* HEADER */}

<div className="flex justify-between items-center mb-8">

<h1 className="text-3xl font-bold">
BidBlitz
</h1>

<div className="bg-slate-800 px-4 py-2 rounded-xl">
💰 1200 Coins
</div>

</div>


{/* QUICK SERVICES */}

<div className="grid grid-cols-4 gap-4">

{modules.map((m)=>(
<div
key={m.title}
className="bg-slate-800 hover:bg-slate-700 transition p-4 rounded-xl text-center cursor-pointer"
>

<div className="text-3xl">
{m.icon}
</div>

<p className="mt-2 text-sm">
{m.title}
</p>

</div>
))}

</div>


{/* FEATURE SECTION */}

<div className="mt-10 bg-slate-800 p-6 rounded-xl">

<h2 className="text-xl font-bold mb-3">
🔥 Featured
</h2>

<p className="opacity-70">
Play Games • Mine Coins • Ride Taxi • Trade Marketplace
</p>

</div>

</div>

)

}
