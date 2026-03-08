import React from "react";

export default function GamesLobby(){

const games = [

{icon:"🍬",name:"Candy Match"},
{icon:"⚡",name:"Reaction"},
{icon:"🎡",name:"Lucky Wheel"},
{icon:"🎴",name:"Scratch Card"},
{icon:"🧠",name:"Puzzle"},
{icon:"🐍",name:"Snake"}

]

return(

<div className="min-h-screen bg-purple-900 text-white p-6">

<h1 className="text-3xl font-bold mb-6">
🎮 BidBlitz Games
</h1>

<div className="grid grid-cols-2 gap-4">

{games.map((g)=>(
<div
key={g.name}
className="bg-purple-700 hover:bg-purple-600 transition p-6 rounded-xl text-center cursor-pointer"
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
