import React from "react";

export default function BidBlitzGames(){

const games = [

{icon:"🍬",title:"Candy Match"},
{icon:"🎡",title:"Lucky Wheel"},
{icon:"⚡",title:"Reaction Game"},
{icon:"🎴",title:"Scratch Card"},
{icon:"🧠",title:"Puzzle"},
{icon:"🐍",title:"Snake"},
{icon:"🚗",title:"Racing"},
{icon:"🪙",title:"Coin Flip"},
{icon:"🎯",title:"Target"},
{icon:"🏃",title:"Runner"}

]

return(

<div className="min-h-screen bg-gradient-to-b from-purple-700 to-slate-900 text-white p-6">

<h1 className="text-3xl font-bold mb-6">
🎮 BidBlitz Games
</h1>

<div className="grid grid-cols-3 gap-4">

{games.map((g)=>(
<div
key={g.title}
className="bg-slate-800 hover:bg-slate-700 transition p-5 rounded-xl text-center cursor-pointer"
>

<div className="text-3xl">
{g.icon}
</div>

<p className="mt-2 text-sm font-semibold">
{g.title}
</p>

</div>
))}

</div>

</div>

)

}
