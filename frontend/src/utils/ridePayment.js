// Ride Payment Utility

export function payRide(cost){

  const balance = parseInt(localStorage.getItem("bbz_coins") || "0")

  if(balance >= cost){

    localStorage.setItem("bbz_coins", balance - cost)
    alert("Ride started!")
    return true

  }else{

    alert("Not enough coins")
    return false

  }

}

export function getBalance(){
  return parseInt(localStorage.getItem("bbz_coins") || "0")
}

export function addCoins(amount){
  const balance = getBalance()
  localStorage.setItem("bbz_coins", balance + amount)
}
