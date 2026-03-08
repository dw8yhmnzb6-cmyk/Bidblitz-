import React, {useState} from "react";

export default function BuildGame(){

const [coins,setCoins] = useState(50)
const [stars,setStars] = useState(3)
const [level,setLevel] = useState(1)

const buildings = [
{icon:"🏠",name:"Haus",cost:20,unlocked:true},
{icon:"🌳",name:"Baum",cost:10,unlocked:true},
{icon:"🌻",name:"Garten",cost:15,unlocked:true},
{icon:"🏪",name:"Shop",cost:50,unlocked:level>=2},
{icon:"🏭",name:"Fabrik",cost:100,unlocked:level>=3},
{icon:"🏰",name:"Schloss",cost:200,unlocked:level>=4}
]

const [built,setBuilt] = useState([])

function playGame(){
let win = Math.random() > 0.4
if(win){
let reward = Math.floor(Math.random()*20)+10
setCoins(coins+reward)
setStars(stars+1)
alert("🎮 Gewonnen! +"+reward+" Coins +1 ⭐")
checkLevel()
}else{
alert("Nochmal versuchen!")
}
}

function checkLevel(){
if(stars>=5 && level===1) setLevel(2)
if(stars>=10 && level===2) setLevel(3)
if(stars>=20 && level===3) setLevel(4)
}

function build(b){
if(!b.unlocked){
alert("Level "+level+" - Noch gesperrt!")
return
}
if(coins<b.cost){
alert("Nicht genug Coins!")
return
}
setCoins(coins-b.cost)
setBuilt([...built,b.icon])
alert(b.name+" gebaut!")
}

return(

<div className="min-h-screen bg-gradient-to-b from-green-700 to-slate-900 text-white p-6">

{/* HEADER */}

<div className="flex justify-between mb-6">

<div>
<h1 className="text-2xl font-bold">🏗️ BidBlitz Builder</h1>
<p className="text-sm opacity-70">Level {level}</p>
</div>

<div className="flex gap-4">
<div className="bg-slate-800 px-3 py-2 rounded-xl">💰 {coins}</div>
<div className="bg-slate-800 px-3 py-2 rounded-xl">⭐ {stars}</div>
</div>

</div>


{/* PLAY GAME */}

<button
onClick={playGame}
className="w-full bg-purple-600 hover:bg-purple-500 p-4 rounded-xl mb-6 text-lg font-bold transition"
>
🎮 Spiel spielen
</button>


{/* BUILD AREA */}

<h2 className="text-xl font-bold mb-4">🏗️ Bauen</h2>

<div className="grid grid-cols-3 gap-4 mb-6">

{buildings.map((b)=>(
<button
key={b.name}
onClick={()=>build(b)}
className={`p-4 rounded-xl text-center transition ${
b.unlocked 
? "bg-slate-800 hover:bg-slate-700" 
: "bg-slate-900 opacity-50"
}`}
>

<div className="text-3xl">{b.icon}</div>
<p className="text-sm mt-1">{b.name}</p>
<p className="text-xs opacity-70">{b.cost} 💰</p>
{!b.unlocked && <p className="text-xs text-red-400">🔒</p>}

</button>
))}

</div>


{/* MY CITY */}

<h2 className="text-xl font-bold mb-4">🌆 Meine Stadt</h2>

<div className="bg-slate-800 p-4 rounded-xl min-h-24 flex flex-wrap gap-2">

{built.length===0 ? (
<p className="opacity-50">Noch nichts gebaut...</p>
) : (
built.map((b,i)=>(
<span key={i} className="text-3xl">{b}</span>
))
)}

</div>


{/* LEVEL PROGRESS */}

<div className="mt-6 bg-slate-800 p-4 rounded-xl">

<h3 className="font-bold mb-2">📈 Level Progress</h3>

<div className="space-y-2 text-sm">
<p className={level>=2 ? "text-green-400" : ""}>⭐5 → Level 2 (Shop)</p>
<p className={level>=3 ? "text-green-400" : ""}>⭐10 → Level 3 (Fabrik)</p>
<p className={level>=4 ? "text-green-400" : ""}>⭐20 → Level 4 (Schloss)</p>
</div>

</div>

</div>

)

}
