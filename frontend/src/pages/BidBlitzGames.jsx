import React, {useState} from "react";

export default function BidBlitzGames(){

const [coins,setCoins] = useState(0)

function candy(){
let r = Math.random()
if(r>0.5){
setCoins(coins+10)
alert("Candy Match +10 coins")
}else{
alert("Try again")
}
}

function wheel(){
let win = Math.floor(Math.random()*5)*10
setCoins(coins+win)
alert("Lucky Wheel +"+win+" coins")
}

function reaction(){
let r = Math.random()
if(r>0.7){
setCoins(coins+5)
alert("Fast reaction +5 coins")
}else{
alert("Too slow")
}
}

return(

<div className="min-h-screen bg-purple-900 text-white p-6">

<h1 className="text-3xl font-bold mb-6">
🎮 BidBlitz Games
</h1>

<p className="mb-6">
Coins: {coins}
</p>

<div className="grid grid-cols-2 gap-4">

<button
onClick={candy}
className="bg-pink-500 p-6 rounded-xl hover:bg-pink-400 transition">
🍬 Candy Match
</button>

<button
onClick={wheel}
className="bg-yellow-500 p-6 rounded-xl hover:bg-yellow-400 transition">
🎡 Lucky Wheel
</button>

<button
onClick={reaction}
className="bg-blue-500 p-6 rounded-xl hover:bg-blue-400 transition">
⚡ Reaction Game
</button>

</div>

</div>

)

}
