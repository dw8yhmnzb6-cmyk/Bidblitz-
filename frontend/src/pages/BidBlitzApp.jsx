import React from "react";

export default function BidBlitzApp(){

const modules = [
{icon:"💰",title:"Wallet"},
{icon:"⛏",title:"Mining"},
{icon:"🎮",title:"Games"},
{icon:"🚕",title:"Taxi"},
{icon:"🛴",title:"Scooter"},
{icon:"🚲",title:"Bike"}
]

return(

<div className="min-h-screen bg-gradient-to-b from-purple-700 to-slate-900 text-white p-6 flex flex-col justify-between">

{/* HEADER */}

<div>

<div className="flex justify-between items-center mb-6">

<h1 className="text-3xl font-bold">
BidBlitz
</h1>

<div className="bg-slate-800 px-4 py-2 rounded-xl">
💰 1200 Coins
</div>

</div>


{/* QUICK MODULES */}

<div className="grid grid-cols-3 gap-4">

{modules.map((m)=>(
<div
key={m.title}
className="bg-slate-800 hover:bg-slate-700 p-5 rounded-xl text-center cursor-pointer transition"
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


{/* FEATURE */}

<div className="mt-8 bg-slate-800 p-6 rounded-xl">

<h2 className="text-xl font-bold">
🔥 Featured
</h2>

<p className="opacity-70 mt-2">
Play games, mine coins and use ride services.
</p>

</div>

</div>


{/* BOTTOM NAVIGATION */}

<div className="flex justify-around bg-slate-800 p-3 rounded-xl mt-6">

<div className="text-center">🏠<p className="text-xs">Home</p></div>
<div className="text-center">🎮<p className="text-xs">Games</p></div>
<div className="text-center">⛏<p className="text-xs">Mining</p></div>
<div className="text-center">💰<p className="text-xs">Wallet</p></div>
<div className="text-center">👤<p className="text-xs">Profile</p></div>

</div>

</div>

)

}
