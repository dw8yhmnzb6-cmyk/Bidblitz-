import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RevengeBidScreen = ({ route, navigation }) => {
  const { auctionId, auctionName } = route.params || {};
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [striking, setStriking] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownRef = useRef(null);

  useEffect(() => {
    if (auctionId) {
      fetchStatus();
      fetchStats();
    }
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [auctionId]);

  useEffect(() => {
    if (status?.can_revenge) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start countdown
      countdownRef.current = setInterval(() => {
        fetchStatus();
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }
  }, [status?.can_revenge]);

  const fetchStatus = async () => {
    try {
      const response = await api.get(`/revenge-bid/status/${auctionId}`);
      setStatus(response.data);
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/revenge-bid/stats');
      setStats(response.data);
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const executeRevenge = async () => {
    setStriking(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const response = await api.post('/revenge-bid/strike', {
        auction_id: auctionId,
      });
      
      Alert.alert('⚡ Zurückgeschlagen!', response.data?.message);
      if (refreshUser) refreshUser();
      fetchStatus();
      fetchStats();
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Konnte nicht zurückschlagen');
    } finally {
      setStriking(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        style={styles.header}
      >
        <Ionicons name="flash" size={56} color="#fff" />
        <Text style={styles.headerTitle}>Revenge Bid</Text>
        <Text style={styles.headerSubtitle}>
          Sofort zurückschlagen wenn du überboten wurdest!
        </Text>
      </LinearGradient>

      {/* Status Card */}
      <View style={styles.statusCard}>
        {status?.can_revenge ? (
          <>
            <View style={styles.alertBanner}>
              <Ionicons name="warning" size={24} color="#F59E0B" />
              <Text style={styles.alertText}>Du wurdest überboten!</Text>
            </View>
            
            <Text style={styles.auctionName}>{auctionName || 'Auktion'}</Text>
            
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Verbleibende Zeit:</Text>
              <Text style={styles.countdownValue}>{status.time_remaining}s</Text>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.revengeBtn}
                onPress={executeRevenge}
                disabled={striking}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.revengeBtnGradient}
                >
                  <Ionicons name="flash" size={32} color="#fff" />
                  <Text style={styles.revengeBtnText}>
                    {striking ? 'Wird ausgeführt...' : 'ZURÜCKSCHLAGEN!'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <View style={styles.noRevengeState}>
            <Ionicons 
              name={status?.reason === 'Du bist aktuell Höchstbieter' ? 'checkmark-circle' : 'time'} 
              size={64} 
              color={status?.reason === 'Du bist aktuell Höchstbieter' ? '#10B981' : '#6B7280'} 
            />
            <Text style={styles.noRevengeTitle}>
              {status?.reason === 'Du bist aktuell Höchstbieter' 
                ? '✅ Du führst!' 
                : 'Kein Revenge möglich'}
            </Text>
            <Text style={styles.noRevengeText}>
              {status?.reason || 'Wähle eine Auktion bei der du überboten wurdest'}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Deine Revenge-Statistik</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_revenge_bids}</Text>
              <Text style={styles.statLabel}>Revenge Bids</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.auctions_won_after_revenge}</Text>
              <Text style={styles.statLabel}>Gewonnen</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.success_rate}%</Text>
              <Text style={styles.statLabel}>Erfolgsrate</Text>
            </View>
          </View>
        </View>
      )}

      {/* How it works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>⚡ So funktioniert's:</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoNumber}>1</Text>
          <Text style={styles.infoText}>Jemand überbitet dich</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoNumber}>2</Text>
          <Text style={styles.infoText}>Du hast 30 Sekunden Zeit</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoNumber}>3</Text>
          <Text style={styles.infoText}>Ein Klick = Sofort zurückbieten!</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: '#1F2937',
    margin: 16,
    borderRadius: 16,
    padding: 24,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  alertText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  auctionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  countdownLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  countdownValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  revengeBtn: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  revengeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  revengeBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  noRevengeState: {
    alignItems: 'center',
    padding: 24,
  },
  noRevengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  noRevengeText: {
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  infoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1F2937',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
});

export default RevengeBidScreen;
