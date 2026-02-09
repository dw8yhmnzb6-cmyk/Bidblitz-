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
import api from '../services/api';

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_bid',
    name: 'Erster Schritt',
    description: 'Platziere dein erstes Gebot',
    icon: 'flag',
    color: '#10B981',
    xp: 10,
  },
  {
    id: 'first_win',
    name: 'Gewinner!',
    description: 'Gewinne deine erste Auktion',
    icon: 'trophy',
    color: '#F59E0B',
    xp: 50,
  },
  {
    id: 'bid_master',
    name: 'Bieter-Meister',
    description: 'Platziere 100 Gebote',
    icon: 'flash',
    color: '#8B5CF6',
    xp: 100,
  },
  {
    id: 'early_bird',
    name: 'Frühaufsteher',
    description: 'Biete vor 7 Uhr morgens',
    icon: 'sunny',
    color: '#F59E0B',
    xp: 25,
  },
  {
    id: 'night_owl',
    name: 'Nachteule',
    description: 'Biete nach Mitternacht',
    icon: 'moon',
    color: '#6366F1',
    xp: 25,
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Lade 5 Freunde ein',
    icon: 'people',
    color: '#EC4899',
    xp: 75,
  },
  {
    id: 'streak_7',
    name: '7-Tage-Streak',
    description: 'Logge dich 7 Tage hintereinander ein',
    icon: 'flame',
    color: '#EF4444',
    xp: 70,
  },
  {
    id: 'streak_30',
    name: '30-Tage-Streak',
    description: 'Logge dich 30 Tage hintereinander ein',
    icon: 'bonfire',
    color: '#EF4444',
    xp: 300,
  },
  {
    id: 'big_spender',
    name: 'Big Spender',
    description: 'Kaufe 500 Gebote',
    icon: 'wallet',
    color: '#10B981',
    xp: 150,
  },
  {
    id: 'vip_member',
    name: 'VIP Member',
    description: 'Werde VIP-Mitglied',
    icon: 'star',
    color: '#F59E0B',
    xp: 200,
  },
  {
    id: 'team_player',
    name: 'Teamplayer',
    description: 'Gewinne mit einem Team',
    icon: 'people-circle',
    color: '#8B5CF6',
    xp: 100,
  },
  {
    id: 'mystery_master',
    name: 'Mystery Master',
    description: 'Gewinne 3 Mystery Boxen',
    icon: 'gift',
    color: '#EC4899',
    xp: 150,
  },
];

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

const AchievementsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/achievements/my');
      const earned = response.data?.achievements || [];
      setAchievements(earned);
      
      // Calculate total XP
      const xp = earned.reduce((sum, a) => {
        const def = ACHIEVEMENTS.find(d => d.id === a.achievement_id);
        return sum + (def?.xp || 0);
      }, 0);
      setTotalXP(xp);
      
      // Animate progress
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.log('Error:', error);
      // Demo data
      setAchievements([
        { achievement_id: 'first_bid', earned_at: new Date().toISOString() },
        { achievement_id: 'streak_7', earned_at: new Date().toISOString() },
      ]);
      setTotalXP(80);
    } finally {
      setLoading(false);
    }
  };

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
  const xpProgress = (totalXP - currentLevel.xp) / (nextLevel.xp - currentLevel.xp);

  const isEarned = (achievementId) => {
    return achievements.some(a => a.achievement_id === achievementId);
  };

  const renderAchievement = (achievement) => {
    const earned = isEarned(achievement.id);
    
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
        <View style={[styles.achievementIcon, { backgroundColor: earned ? achievement.color : '#374151' }]}>
          <Ionicons 
            name={achievement.icon} 
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
            <Text style={styles.xpText}>+{achievement.xp} XP</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.statValue}>{achievements.length}</Text>
          <Text style={styles.statLabel}>Freigeschaltet</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ACHIEVEMENTS.length - achievements.length}</Text>
          <Text style={styles.statLabel}>Verbleibend</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round((achievements.length / ACHIEVEMENTS.length) * 100)}%</Text>
          <Text style={styles.statLabel}>Abgeschlossen</Text>
        </View>
      </View>

      {/* Achievements List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Alle Achievements</Text>
        
        {/* Earned */}
        {achievements.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>✅ Freigeschaltet</Text>
            {ACHIEVEMENTS.filter(a => isEarned(a.id)).map(renderAchievement)}
          </View>
        )}
        
        {/* Locked */}
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>🔒 Noch zu verdienen</Text>
          {ACHIEVEMENTS.filter(a => !isEarned(a.id)).map(renderAchievement)}
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
