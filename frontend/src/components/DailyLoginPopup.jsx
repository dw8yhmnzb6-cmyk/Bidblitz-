/**
 * DailyLoginPopup - Auto-popup for daily login rewards
 * Shows automatically when user logs in and can claim their daily reward
 */
import { useState, useEffect } from 'react';
import { X, Gift, Flame, Star, Sparkles, Calendar, ChevronRight, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';

const translations = {
  de: {
    welcome: 'Willkommen zurück!',
    dailyReward: 'Deine tägliche Belohnung',
    streak: 'Tage-Streak',
    claim: 'Belohnung abholen!',
    skip: 'Später',
    freeBids: 'Gratis-Gebote',
    bonus: 'Bonus',
    vipDays: 'VIP-Tage',
    day: 'Tag',
    nextMilestone: 'Nächster Meilenstein',
    daysLeft: 'Tage noch',
    keepItUp: 'Weiter so!',
    streakBonus: 'Streak-Bonus!',
    alreadyClaimed: 'Bereits abgeholt',
    comeBackTomorrow: 'Komm morgen wieder!',
    todayReward: 'Heute erhältst du'
  },
  en: {
    welcome: 'Welcome back!',
    dailyReward: 'Your daily reward',
    streak: 'Day Streak',
    claim: 'Claim Reward!',
    skip: 'Later',
    freeBids: 'Free Bids',
    bonus: 'Bonus',
    vipDays: 'VIP Days',
    day: 'Day',
    nextMilestone: 'Next Milestone',
    daysLeft: 'days left',
    keepItUp: 'Keep it up!',
    streakBonus: 'Streak Bonus!',
    alreadyClaimed: 'Already claimed',
    comeBackTomorrow: 'Come back tomorrow!',
    todayReward: 'Today you receive'
  },
  sq: {
    welcome: 'Mirë se u ktheve!',
    dailyReward: 'Shpërblimi yt ditor',
    streak: 'Ditë Streak',
    claim: 'Merr Shpërblimin!',
    skip: 'Më vonë',
    freeBids: 'Oferta Falas',
    bonus: 'Bonus',
    vipDays: 'Ditë VIP',
    day: 'Dita',
    nextMilestone: 'Pika tjetër',
    daysLeft: 'ditë mbeten',
    keepItUp: 'Vazhdo kështu!',
    streakBonus: 'Bonus Streak!',
    alreadyClaimed: 'Tashmë e marrë',
    comeBackTomorrow: 'Kthehu nesër!',
    todayReward: 'Sot merr'
  },
  tr: {
    welcome: 'Tekrar hoş geldin!',
    dailyReward: 'Günlük ödülün',
    streak: 'Gün Serisi',
    claim: 'Ödülü Al!',
    skip: 'Sonra',
    freeBids: 'Ücretsiz Teklifler',
    bonus: 'Bonus',
    vipDays: 'VIP Günleri',
    day: 'Gün',
    nextMilestone: 'Sonraki Hedef',
    daysLeft: 'gün kaldı',
    keepItUp: 'Devam et!',
    streakBonus: 'Seri Bonusu!',
    alreadyClaimed: 'Zaten alındı',
    comeBackTomorrow: 'Yarın tekrar gel!',
    todayReward: 'Bugün alıyorsun'
  }
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DailyLoginPopup = ({ language = 'de', token, isAuthenticated, onClose, onRewardClaimed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);
  
  const t = translations[language] || translations.de;

  useEffect(() => {
    const checkAndShowPopup = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      // Check if popup was already shown today
      const lastShown = localStorage.getItem('dailyLoginPopupLastShown');
      const today = new Date().toDateString();
      
      if (lastShown === today) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API}/gamification/login-streak`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setStreakData(data);
          
          // Show popup if user can claim
          if (data.can_claim) {
            setIsOpen(true);
            localStorage.setItem('dailyLoginPopupLastShown', today);
          }
        }
      } catch (err) {
        console.error('Error checking login streak:', err);
      } finally {
        setLoading(false);
      }
    };

    // Delay popup by 2 seconds for better UX
    const timer = setTimeout(checkAndShowPopup, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, token]);

  const handleClaim = async () => {
    if (claiming) return;
    
    setClaiming(true);
    try {
      const res = await fetch(`${API}/gamification/daily-login`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setShowConfetti(true);
        setClaimedReward(data.reward);
        
        // Update streak data
        setStreakData(prev => ({
          ...prev,
          can_claim: false,
          current_streak: data.current_streak
        }));
        
        const message = language === 'de' ? data.message_de : data.message_en;
        toast.success(message, { duration: 4000 });
        
        if (data.new_badge) {
          setTimeout(() => {
            toast.success(`🏅 Neues Achievement: ${data.new_badge.name}`, { duration: 5000 });
          }, 1000);
        }
        
        if (onRewardClaimed) {
          onRewardClaimed(data);
        }
        
        // Close popup after animation
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err) {
      toast.error('Fehler beim Abholen der Belohnung');
    } finally {
      setClaiming(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (loading || !isOpen || !streakData) return null;

  const currentStreak = streakData.current_streak || 0;
  const nextReward = streakData.next_reward;
  const canClaim = streakData.can_claim;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      />
      
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
                backgroundColor: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Popup */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn"
        data-testid="daily-login-popup"
      >
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-8 text-white text-center overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
          <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-300/50 animate-pulse" />
          <Star className="absolute bottom-4 right-4 w-5 h-5 text-yellow-300/50 animate-pulse" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce-slow">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1">{t.welcome}</h2>
            <p className="text-amber-100">{t.dailyReward}</p>
            
            {/* Streak Badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Flame className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span className="font-bold text-lg">{currentStreak}</span>
              <span className="text-sm opacity-90">{t.streak}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Reward Display */}
          {canClaim && nextReward && !claimedReward && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border-2 border-amber-200 border-dashed">
              <p className="text-sm text-amber-700 text-center mb-3">{t.todayReward}</p>
              <div className="flex items-center justify-center gap-6">
                {/* Free Bids */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-2 mx-auto">
                    <span className="text-2xl font-black">+{nextReward.free_bids}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{t.freeBids}</p>
                </div>
                
                {/* Bonus */}
                {nextReward.bonus > 0 && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-2 mx-auto">
                      <span className="text-xl font-black">€{nextReward.bonus}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{t.bonus}</p>
                  </div>
                )}
                
                {/* VIP Days */}
                {nextReward.vip_days > 0 && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-2 mx-auto">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{nextReward.vip_days} {t.vipDays}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Already Claimed */}
          {!canClaim && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-700 font-medium">{t.alreadyClaimed}</p>
              <p className="text-gray-500 text-sm mt-1">{t.comeBackTomorrow}</p>
            </div>
          )}

          {/* Claimed Reward Animation */}
          {claimedReward && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 text-center border-2 border-green-300">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-700 font-bold text-lg">{t.streakBonus}</p>
              <p className="text-green-600 text-2xl font-black mt-2">+{claimedReward.free_bids} {t.freeBids}</p>
              {claimedReward.bonus > 0 && (
                <p className="text-green-600 font-bold">+€{claimedReward.bonus} {t.bonus}</p>
              )}
            </div>
          )}

          {/* Next Milestone */}
          {streakData.upcoming_milestones && streakData.upcoming_milestones[0] && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t.nextMilestone}</p>
                    <p className="font-semibold text-gray-700">{t.day} {streakData.upcoming_milestones[0].day}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">+{streakData.upcoming_milestones[0].reward.free_bids}</p>
                  <p className="text-xs text-gray-500">{streakData.upcoming_milestones[0].days_remaining} {t.daysLeft}</p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              {t.skip}
            </button>
            <button
              onClick={handleClaim}
              disabled={!canClaim || claiming || claimedReward}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                canClaim && !claimedReward
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {claiming ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : claimedReward ? (
                <>
                  <span>✓</span>
                  <span>{t.keepItUp}</span>
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  <span>{t.claim}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-confetti-fall { animation: confetti-fall 3s ease-out forwards; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default DailyLoginPopup;
