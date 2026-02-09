import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../services/api';

const TIER_COLORS = {
  bronze: ['#CD7F32', '#8B4513'],
  silver: ['#C0C0C0', '#A9A9A9'],
  gold: ['#FFD700', '#DAA520'],
  diamond: ['#B9F2FF', '#00CED1'],
};

const TIER_EMOJIS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎',
};

const MysteryBoxScreen = ({ navigation }) => {
  const [boxes, setBoxes] = useState([]);
  const [tiers, setTiers] = useState({});
  const [loading, setLoading] = useState(true);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    startShimmerAnimation();
  }, []);

  const startShimmerAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchData = async () => {
    try {
      const [boxesRes, tiersRes] = await Promise.all([
        api.get('/mystery-box/active'),
        api.get('/mystery-box/tiers'),
      ]);
      
      setBoxes(boxesRes.data || []);
      setTiers(tiersRes.data || {});
    } catch (error) {
      console.log('Error:', error);
      // Demo data
      setBoxes([
        {
          id: '1',
          tier: 'gold',
          current_price: 2.50,
          total_bids: 45,
          time_remaining: 3600,
          hint: 'Perfekt für Technik-Fans',
        },
        {
          id: '2',
          tier: 'diamond',
          current_price: 8.20,
          total_bids: 120,
          time_remaining: 7200,
          hint: 'Limitierte Edition',
        },
        {
          id: '3',
          tier: 'silver',
          current_price: 1.10,
          total_bids: 22,
          time_remaining: 1800,
          hint: 'Ideal für unterwegs',
        },
      ]);
      setTiers({
        bronze: { name: 'Bronze Box', min_value: 50, max_value: 150 },
        silver: { name: 'Silber Box', min_value: 150, max_value: 400 },
        gold: { name: 'Gold Box', min_value: 400, max_value: 1000 },
        diamond: { name: 'Diamant Box', min_value: 1000, max_value: 5000 },
      });
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (boxId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const response = await api.post(`/mystery-box/${boxId}/bid`);
      
      if (response.data?.hint) {
        Alert.alert('💡 Hinweis!', response.data.hint);
      }
      
      fetchData();
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Gebot fehlgeschlagen');
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderBox = ({ item }) => {
    const tierInfo = tiers[item.tier] || {};
    const colors = TIER_COLORS[item.tier] || TIER_COLORS.bronze;
    const emoji = TIER_EMOJIS[item.tier] || '📦';
    
    return (
      <TouchableOpacity 
        style={styles.boxCard}
        onPress={() => navigation.navigate('MysteryBoxDetail', { box: item })}
      >
        <LinearGradient
          colors={colors}
          style={styles.boxGradient}
        >
          <Animated.View 
            style={[
              styles.shimmer,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.8, 0.3],
                }),
              }
            ]}
          />
          
          <View style={styles.boxContent}>
            <Text style={styles.boxEmoji}>{emoji}</Text>
            <Text style={styles.boxName}>{tierInfo.name || 'Mystery Box'}</Text>
            <View style={styles.mysteryProduct}>
              <Ionicons name="help-circle" size={40} color="rgba(255,255,255,0.5)" />
              <Text style={styles.mysteryText}>???</Text>
            </View>
            <Text style={styles.valueRange}>
              Wert: €{tierInfo.min_value} - €{tierInfo.max_value}
            </Text>
          </View>
          
          {item.hint && (
            <View style={styles.hintBadge}>
              <Ionicons name="bulb" size={12} color="#F59E0B" />
              <Text style={styles.hintText}>{item.hint}</Text>
            </View>
          )}
        </LinearGradient>
        
        <View style={styles.boxFooter}>
          <View style={styles.boxStats}>
            <View style={styles.boxStat}>
              <Text style={styles.boxStatLabel}>Preis</Text>
              <Text style={styles.boxStatValue}>€{item.current_price?.toFixed(2)}</Text>
            </View>
            <View style={styles.boxStat}>
              <Text style={styles.boxStatLabel}>Gebote</Text>
              <Text style={styles.boxStatValue}>{item.total_bids}</Text>
            </View>
            <View style={styles.boxStat}>
              <Text style={styles.boxStatLabel}>Zeit</Text>
              <Text style={[styles.boxStatValue, styles.timeValue]}>
                {formatTime(item.time_remaining || 0)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.bidButton}
            onPress={() => placeBid(item.id)}
          >
            <Text style={styles.bidButtonText}>BIETEN</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTierCard = (tier, info) => (
    <TouchableOpacity key={tier} style={styles.tierCard}>
      <LinearGradient
        colors={TIER_COLORS[tier] || ['#666', '#333']}
        style={styles.tierGradient}
      >
        <Text style={styles.tierEmoji}>{TIER_EMOJIS[tier]}</Text>
        <Text style={styles.tierName}>{info.name}</Text>
        <Text style={styles.tierValue}>€{info.min_value}-{info.max_value}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>📦✨</Text>
        <Text style={styles.headerTitle}>Mystery Box</Text>
        <Text style={styles.headerSubtitle}>
          Was ist drin? Biete und finde es heraus!
        </Text>
      </LinearGradient>

      {/* Tier Overview */}
      <View style={styles.tiersSection}>
        <Text style={styles.sectionTitle}>Box-Stufen</Text>
        <View style={styles.tiersRow}>
          {Object.entries(tiers).map(([tier, info]) => renderTierCard(tier, info))}
        </View>
      </View>

      {/* Active Boxes */}
      <Text style={styles.sectionTitle}>Aktive Mystery Boxen</Text>
      <FlatList
        data={boxes}
        renderItem={renderBox}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boxList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>Keine aktiven Mystery Boxen</Text>
          </View>
        }
      />

      {/* Recent Wins */}
      <TouchableOpacity style={styles.winsTeaser}>
        <Ionicons name="trophy" size={20} color="#F59E0B" />
        <Text style={styles.winsText}>Was andere gewonnen haben...</Text>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
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
  headerEmoji: {
    fontSize: 45,
    marginBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  tiersSection: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 15,
    marginTop: 15,
  },
  tiersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierCard: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tierGradient: {
    alignItems: 'center',
    padding: 10,
  },
  tierEmoji: {
    fontSize: 20,
  },
  tierName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 3,
  },
  tierValue: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
  },
  boxList: {
    paddingHorizontal: 15,
  },
  boxCard: {
    width: 280,
    backgroundColor: '#1F2937',
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
  },
  boxGradient: {
    height: 200,
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  boxContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  boxEmoji: {
    fontSize: 35,
  },
  boxName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  mysteryProduct: {
    alignItems: 'center',
    marginVertical: 10,
  },
  mysteryText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 24,
    fontWeight: 'bold',
  },
  valueRange: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  hintBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hintText: {
    color: '#F59E0B',
    fontSize: 11,
    marginLeft: 5,
  },
  boxFooter: {
    padding: 15,
  },
  boxStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  boxStat: {
    alignItems: 'center',
  },
  boxStatLabel: {
    color: '#6B7280',
    fontSize: 10,
  },
  boxStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeValue: {
    color: '#EF4444',
  },
  bidButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  bidButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    width: 280,
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1F2937',
    borderRadius: 15,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  winsTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  winsText: {
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
});

export default MysteryBoxScreen;
