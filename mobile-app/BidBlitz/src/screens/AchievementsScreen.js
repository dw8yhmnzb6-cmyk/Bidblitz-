import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { achievementsAPI } from '../services/api';

// Icon mapping from text to Ionicons
const ICON_MAP = {
  '🎯': 'flag',
  '⚡': 'flash',
  '🔥': 'flame',
  '💎': 'diamond',
  '👑': 'crown',
  '🏆': 'trophy',
  '🥇': 'medal',
  '🌟': 'star',
  '🎖️': 'ribbon',
  '🦉': 'moon',
  '💰': 'cash',
  '🤝': 'people',
  '🌐': 'globe',
  '✍️': 'create',
  '📅': 'calendar',
  '🏠': 'home',
};

// Level thresholds
const LEVELS = [
  { level: 1, xp: 0, title: 'Anfänger' },
  { level: 2, xp: 100, title: 'Einsteiger' },
  { level: 3, xp: 250, title: 'Bieter' },
  { level: 4, xp: 500, title: 'Erfahren' },
  { level: 5, xp: 1000, title: 'Experte' },
  { level: 6, xp: 2000, title: 'Meister' },
  { level: 7, xp: 4000, title: 'Großmeister' },
  { level: 8, xp: 7500, title: 'Champion' },
  { level: 9, xp: 12000, title: 'Legende' },
  { level: 10, xp: 20000, title: 'BidBlitz König' },
];

const CATEGORY_COLORS = {
  bidding: '#8B5CF6',
  winning: '#F59E0B',
  special: '#EC4899',
  social: '#10B981',
  loyalty: '#6366F1',
};

const AchievementsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ earned: 0, total: 0, progress_percent: 0, total_rewards_earned: 0 });
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await achievementsAPI.getMy('de');
      setAchievements(response.data?.achievements || []);
      setStats(response.data?.stats || { earned: 0, total: 0, progress_percent: 0, total_rewards_earned: 0 });
      
      // Animate progress
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.log('Error fetching achievements:', error);
      // Use empty state
      setAchievements([]);
      setStats({ earned: 0, total: 0, progress_percent: 0, total_rewards_earned: 0 });
    } finally {
      setLoading(false);
    }
  };

  const totalXP = stats.total_rewards_earned * 10; // Convert bids to XP

  const getCurrentLevel = () => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalXP >= LEVELS[i].xp) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  };

  const getNextLevel = () => {
    const current = getCurrentLevel();
    const nextIndex = LEVELS.findIndex(l => l.level === current.level) + 1;
    return LEVELS[nextIndex] || LEVELS[LEVELS.length - 1];
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const xpProgress = nextLevel.xp > currentLevel.xp 
    ? (totalXP - currentLevel.xp) / (nextLevel.xp - currentLevel.xp) 
    : 1;

  const getIconName = (emoji) => {
    return ICON_MAP[emoji] || 'star';
  };

  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || '#8B5CF6';
  };

  const renderAchievement = (achievement) => {
    const earned = achievement.earned;
    const color = getCategoryColor(achievement.category);
    
    return (
      <TouchableOpacity
        key={achievement.id}
        style={[styles.achievementCard, !earned && styles.achievementLocked]}
        onPress={() => {
          if (earned) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
      >
        <View style={[styles.achievementIcon, { backgroundColor: earned ? color : '#374151' }]}>
          <Ionicons 
            name={getIconName(achievement.icon)} 
            size={24} 
            color={earned ? '#fff' : '#6B7280'} 
          />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementName, !earned && styles.achievementNameLocked]}>
            {achievement.name}
          </Text>
          <Text style={styles.achievementDesc}>{achievement.description}</Text>
        </View>
        <View style={styles.achievementXP}>
          {earned ? (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          ) : (
            <Text style={styles.xpText}>+{achievement.reward_bids} Gebote</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const earnedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);

  return (
    <ScrollView style={styles.container}>
      {/* Header with Level */}
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.header}
      >
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{currentLevel.level}</Text>
        </View>
        <Text style={styles.levelTitle}>{currentLevel.title}</Text>
        <Text style={styles.xpTotal}>{totalXP} XP</Text>
        
        {/* Progress to next level */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${Math.min(xpProgress * 100, 100)}%`],
                  })
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {nextLevel.xp - totalXP} XP bis Level {nextLevel.level}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.earned}</Text>
          <Text style={styles.statLabel}>Freigeschaltet</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total - stats.earned}</Text>
          <Text style={styles.statLabel}>Verbleibend</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(stats.progress_percent)}%</Text>
          <Text style={styles.statLabel}>Abgeschlossen</Text>
        </View>
      </View>

      {/* Achievements List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Alle Achievements</Text>
        
        {/* Earned */}
        {earnedAchievements.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>✅ Freigeschaltet</Text>
            {earnedAchievements.map(renderAchievement)}
          </View>
        )}
        
        {/* Locked */}
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>🔒 Noch zu verdienen</Text>
          {lockedAchievements.map(renderAchievement)}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 25,
    alignItems: 'center',
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#F59E0B',
  },
  levelNumber: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  levelTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  xpTotal: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 5,
  },
  progressContainer: {
    width: '100%',
    marginTop: 20,
  },
  progressTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 5,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 5,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 15,
  },
  achievementName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  achievementNameLocked: {
    color: '#9CA3AF',
  },
  achievementDesc: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },
  achievementXP: {
    alignItems: 'center',
  },
  xpText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AchievementsScreen;
