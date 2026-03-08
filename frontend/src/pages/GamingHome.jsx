import React from "react";

export default function GamingHome(){

const topGames = [
{icon:"🍬",name:"Candy Match"},
{icon:"🎡",name:"Lucky Wheel"},
{icon:"⚡",name:"Reaction"},
{icon:"🎴",name:"Scratch Card"}
]

const moreGames = [
{icon:"🧠",name:"Puzzle"},
{icon:"🐍",name:"Snake"},
{icon:"🚗",name:"Racing"},
{icon:"🏃",name:"Runner"},
{icon:"🎯",name:"Target"},
{icon:"🪙",name:"Coin Flip"},
{icon:"🧱",name:"Block Break"},
{icon:"🧩",name:"Memory"}
]

return(

<div className="min-h-screen bg-gradient-to-b from-purple-700 to-black text-white p-6">

{/* HEADER */}

<div className="flex justify-between mb-6">

<h1 className="text-3xl font-bold">
🎮 BidBlitz Games
</h1>

<div className="bg-slate-800 px-4 py-2 rounded-xl">
💰 1200 Coins
</div>

</div>

{/* TOP GAMES */}

<h2 className="text-xl font-bold mb-4">
🔥 Top Games
</h2>

<div className="grid grid-cols-2 gap-4 mb-8">

{topGames.map((g)=>(
<div
key={g.name}
className="bg-purple-600 hover:bg-purple-500 p-6 rounded-xl text-center cursor-pointer transition"
>

<div className="text-4xl">{g.icon}</div>

<p className="mt-2 font-semibold">
{g.name}
</p>

</div>
))}

</div>

{/* MORE GAMES */}

<h2 className="text-xl font-bold mb-4">
🎲 More Games
</h2>

<div className="grid grid-cols-3 gap-4">

{moreGames.map((g)=>(
<div
key={g.name}
className="bg-slate-800 hover:bg-slate-700 p-5 rounded-xl text-center cursor-pointer transition"
>

<div className="text-3xl">{g.icon}</div>

<p className="mt-2 text-sm">
{g.name}
</p>

</div>
))}

</div>

</div>

)

}
