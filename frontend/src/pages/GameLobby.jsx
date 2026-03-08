import React from "react";

export default function GameLobby(){

const games = [
{icon:"🍬",name:"Candy Match"},
{icon:"🎡",name:"Lucky Wheel"},
{icon:"⚡",name:"Reaction"},
{icon:"🎴",name:"Scratch Card"},
{icon:"🧠",name:"Puzzle"},
{icon:"🐍",name:"Snake"},
{icon:"🚗",name:"Racing"},
{icon:"🪙",name:"Coin Flip"}
]

return(

<div className="min-h-screen bg-purple-900 text-white p-6">

<h1 className="text-3xl font-bold mb-6">
🎮 BidBlitz Game Lobby
</h1>

<div className="grid grid-cols-2 gap-4">

{games.map((g)=>(
<div
key={g.name}
className="bg-purple-700 hover:bg-purple-600 p-6 rounded-xl text-center cursor-pointer transition"
>

<div className="text-4xl">
{g.icon}
</div>

<p className="mt-2 font-semibold">
{g.name}
</p>

</div>
))}

</div>

</div>

)

}
