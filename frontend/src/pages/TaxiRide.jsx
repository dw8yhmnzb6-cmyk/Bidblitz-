import React from "react";

export default function TaxiRide(){

  return(

    <div className="p-6 text-white bg-slate-900 min-h-screen">

      <h1 className="text-2xl font-bold mb-4">
        🚕 Taxi Ride
      </h1>

      <div className="bg-slate-800 p-5 rounded-xl">

        <p>Start Location</p>
        <input className="w-full mt-1 p-2 rounded text-black"/>

        <p className="mt-4">Destination</p>
        <input className="w-full mt-1 p-2 rounded text-black"/>

        <button className="bg-yellow-500 mt-5 px-5 py-2 rounded-xl text-black font-semibold">
          Book Taxi
        </button>

      </div>

    </div>

  )
}
