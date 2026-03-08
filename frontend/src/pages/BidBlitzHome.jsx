import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function BidBlitzHome() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [language, setLanguage] = useState("de");
  const [coins, setCoins] = useState(1007);

  const languages = [
    { code: "ar", name: "الإمارات", flag: "🇦🇪" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "sq", name: "Shqip", flag: "🇦🇱" },
    { code: "xk", name: "Kosovë", flag: "🇽🇰" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "us", name: "English", flag: "🇺🇸" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  ];

  const sponsoredAds = [
    { icon: "🚕", text: "Taxi Bonus Ride - 10 Coins Cashback" },
    { icon: "🎮", text: "Daily Games - Earn 50 Coins" },
    { icon: "⛏️", text: "Mining Boost - 2x Rewards Today" },
  ];

  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    // Check login status
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }

    // Rotate ads
    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % sponsoredAds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setShowMenu(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[#0c0f22]" : "bg-gray-100"}`}>
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">⚡</span>
          </div>
          <span className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
            BidBlitz<span className="text-orange-500">.ae</span>
          </span>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`p-2 ${darkMode ? "text-white" : "text-slate-800"}`}
        >
          {showMenu ? "✕" : "☰"}
        </button>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div className={`mx-4 mb-4 p-4 rounded-2xl ${darkMode ? "bg-slate-800" : "bg-white"} shadow-lg`}>
          {/* Dark Mode Toggle */}
          <div className="flex justify-between items-center py-3 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <span>🌙</span>
              <span className={darkMode ? "text-white" : "text-slate-800"}>Dunkel Modus</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full transition ${darkMode ? "bg-purple-600" : "bg-slate-300"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition transform ${darkMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Support */}
          <div className="flex justify-between items-center py-3 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <span>💬</span>
              <span className={darkMode ? "text-white" : "text-slate-800"}>Support & Hilfe</span>
            </div>
            <button className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
              6σ
            </button>
          </div>

          {/* Login/Register or Logout */}
          {!isLoggedIn ? (
            <div className="py-4 bg-cyan-50 rounded-xl mt-4 p-4">
              <p className="text-center text-slate-600 mb-3">Jetzt bieten</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="flex-1 py-2 border-2 border-orange-500 text-orange-500 rounded-xl font-medium"
                >
                  Anmelden
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-medium"
                >
                  Registrieren
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-medium mt-4"
            >
              🚪 Abmelden
            </button>
          )}

          {/* Language Selector */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span>🌐</span>
                <span className={darkMode ? "text-white" : "text-slate-800"}>Sprache</span>
              </div>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                {languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.name}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`py-2 px-3 rounded-xl text-sm flex items-center justify-center gap-1 transition ${
                    language === lang.code
                      ? "bg-orange-500 text-white"
                      : darkMode
                      ? "bg-slate-700 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.name.substring(0, 5)}...</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4">
        {/* Greeting */}
        <div className="mb-4">
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            {getGreeting()}, {isLoggedIn ? user?.name || "User" : "Gast"} 👋
          </p>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
            Dein Dashboard
          </h1>
        </div>

        {/* Wallet Card */}
        <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-5 rounded-2xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-white/80">Wallet Balance</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {isLoggedIn ? coins.toLocaleString() : "---"}
            </span>
            <span className="text-white/80">Coins</span>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => isLoggedIn ? navigate("/withdraw") : navigate("/login")}
              className="flex-1 py-2 bg-white/20 rounded-xl text-white flex items-center justify-center gap-2"
            >
              💸 Auszahlen
            </button>
            <button
              onClick={() => isLoggedIn ? navigate("/analytics") : navigate("/login")}
              className="flex-1 py-2 bg-white/20 rounded-xl text-white flex items-center justify-center gap-2"
            >
              📊 Analytics
            </button>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="absolute top-20 right-4">
          <button className="relative">
            <span className="text-2xl">🔔</span>
            {isLoggedIn && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Sponsored Ads */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              SPONSORED
            </span>
            <button className="text-purple-400 text-sm">Nächste →</button>
          </div>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{sponsoredAds[adIndex].icon}</span>
              <span className="text-white">{sponsoredAds[adIndex].text}</span>
            </div>
          </div>
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-3">
            {sponsoredAds.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition ${
                  i === adIndex ? "w-6 bg-purple-500" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Not Logged In Message */}
        {!isLoggedIn && (
          <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 p-4 rounded-xl mb-4">
            <p className={`text-center ${darkMode ? "text-white" : "text-slate-800"}`}>
              ⚠️ Melde dich an, um alle Features zu nutzen!
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => navigate("/login")}
                className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-medium"
              >
                Anmelden
              </button>
              <button
                onClick={() => navigate("/register")}
                className="flex-1 py-2 border border-orange-500 text-orange-500 rounded-xl font-medium"
              >
                Registrieren
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1c213f] border-t border-slate-700 flex justify-around py-3">
        <button className="flex flex-col items-center text-purple-400">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={() => navigate("/games")}
          className="flex flex-col items-center text-slate-500"
        >
          <span className="text-xl">🎮</span>
          <span className="text-xs">Games</span>
        </button>
        <button
          onClick={() => navigate("/app-wallet")}
          className="flex flex-col items-center text-slate-500"
        >
          <span className="text-xl">💳</span>
          <span className="text-xs">Wallet</span>
        </button>
        <button
          onClick={() => navigate("/miner")}
          className="flex flex-col items-center text-slate-500"
        >
          <span className="text-xl">💎</span>
          <span className="text-xs">BBZ</span>
        </button>
        <button
          onClick={() => navigate("/app-profile")}
          className="flex flex-col items-center text-slate-500"
        >
          <span className="text-xl">👤</span>
          <span className="text-xs">Profile</span>
        </button>
      </div>

      <div className="h-20"></div>
    </div>
  );
}
