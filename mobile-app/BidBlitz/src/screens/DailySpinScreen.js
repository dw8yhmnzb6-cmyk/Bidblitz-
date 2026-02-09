import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Wheel segments with prizes
const WHEEL_SEGMENTS = [
  { prize: 1, label: '1', color: '#EF4444', probability: 30 },
  { prize: 2, label: '2', color: '#F59E0B', probability: 25 },
  { prize: 3, label: '3', color: '#10B981', probability: 20 },
  { prize: 5, label: '5', color: '#8B5CF6', probability: 15 },
  { prize: 10, label: '10', color: '#EC4899', probability: 8 },
  { prize: 25, label: '25', color: '#06B6D4', probability: 2 },
];

const DailySpinScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const [lastPrize, setLastPrize] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkSpinStatus();
    animateButton();
  }, []);

  const animateButton = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const checkSpinStatus = async () => {
    try {
      const response = await api.get('/wheel/status');
      setCanSpin(response.data?.can_spin !== false);
      setSpinCount(response.data?.spins_today || 0);
    } catch (error) {
      // Default to allowing spin
      setCanSpin(true);
    }
  };

  const selectPrize = () => {
    // Weighted random selection
    const totalWeight = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.probability, 0);
    let random = Math.random() * totalWeight;
    
    for (const segment of WHEEL_SEGMENTS) {
      random -= segment.probability;
      if (random <= 0) {
        return segment;
      }
    }
    return WHEEL_SEGMENTS[0];
  };

  const spin = async () => {
    if (spinning || !canSpin) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSpinning(true);

    // Select prize
    const selectedPrize = selectPrize();
    const prizeIndex = WHEEL_SEGMENTS.findIndex(s => s.prize === selectedPrize.prize);
    
    // Calculate final rotation
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);
    const totalRotation = 360 * 5 + targetAngle; // 5 full spins + target

    // Reset and animate
    spinAnim.setValue(0);
    
    Animated.timing(spinAnim, {
      toValue: totalRotation,
      duration: 5000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      // Spin complete
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastPrize(selectedPrize);
      setSpinning(false);

      // Try to record on backend
      try {
        await api.post('/wheel/spin', { prize: selectedPrize.prize });
        
        // Update user bids locally
        if (user) {
          const newBids = (user.bids_balance || user.bids || 0) + selectedPrize.prize;
          updateUser({ ...user, bids_balance: newBids, bids: newBids });
        }
      } catch (error) {
        console.log('Error recording spin:', error);
      }

      // Show winner alert
      Alert.alert(
        '🎉 Gewonnen!',
        `Du hast ${selectedPrize.prize} Gratis-Gebote gewonnen!`,
        [{ text: 'Juhu!' }]
      );

      setSpinCount(prev => prev + 1);
      setCanSpin(false);
    });
  };

  const renderWheelSegment = (segment, index) => {
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const rotation = index * segmentAngle;

    return (
      <View
        key={index}
        style={[
          styles.segment,
          {
            backgroundColor: segment.color,
            transform: [
              { rotate: `${rotation}deg` },
              { translateX: 50 },
            ],
          },
        ]}
      >
        <Text style={[styles.segmentText, { transform: [{ rotate: '90deg' }] }]}>
          {segment.label}
        </Text>
      </View>
    );
  };

  const rotation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F59E0B', '#EF4444']}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🎡</Text>
        <Text style={styles.headerTitle}>Tägliches Glücksrad</Text>
        <Text style={styles.headerSubtitle}>
          Drehe jeden Tag und gewinne Gratis-Gebote!
        </Text>
      </LinearGradient>

      {/* Wheel Container */}
      <View style={styles.wheelContainer}>
        {/* Pointer */}
        <View style={styles.pointer}>
          <Ionicons name="caret-down" size={40} color="#EF4444" />
        </View>

        {/* Wheel */}
        <Animated.View
          style={[
            styles.wheel,
            { transform: [{ rotate: rotation }] },
          ]}
        >
          <LinearGradient
            colors={['#374151', '#1F2937']}
            style={styles.wheelInner}
          >
            {WHEEL_SEGMENTS.map((segment, index) => (
              <View
                key={index}
                style={[
                  styles.wheelSection,
                  {
                    backgroundColor: segment.color,
                    transform: [{ rotate: `${index * (360 / WHEEL_SEGMENTS.length)}deg` }],
                  },
                ]}
              >
                <Text style={styles.wheelText}>{segment.label}</Text>
              </View>
            ))}
            <View style={styles.wheelCenter}>
              <Text style={styles.wheelCenterText}>SPIN</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Prizes Legend */}
      <View style={styles.prizesLegend}>
        <Text style={styles.legendTitle}>Mögliche Gewinne:</Text>
        <View style={styles.prizesRow}>
          {WHEEL_SEGMENTS.map((segment, index) => (
            <View key={index} style={styles.prizeItem}>
              <View style={[styles.prizeColor, { backgroundColor: segment.color }]} />
              <Text style={styles.prizeText}>{segment.prize} Gebote</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Spin Button */}
      <Animated.View style={{ transform: [{ scale: canSpin ? scaleAnim : 1 }] }}>
        <TouchableOpacity
          style={[styles.spinButton, !canSpin && styles.spinButtonDisabled]}
          onPress={spin}
          disabled={spinning || !canSpin}
        >
          <LinearGradient
            colors={canSpin ? ['#F59E0B', '#EF4444'] : ['#374151', '#4B5563']}
            style={styles.spinButtonGradient}
          >
            {spinning ? (
              <Text style={styles.spinButtonText}>Dreht...</Text>
            ) : canSpin ? (
              <>
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.spinButtonText}>DREHEN!</Text>
              </>
            ) : (
              <>
                <Ionicons name="time" size={24} color="#9CA3AF" />
                <Text style={[styles.spinButtonText, { color: '#9CA3AF' }]}>
                  Morgen wieder!
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="today" size={18} color="#8B5CF6" />
          <Text style={styles.statText}>Heute gedreht: {spinCount}x</Text>
        </View>
        {lastPrize && (
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={18} color="#F59E0B" />
            <Text style={styles.statText}>Letzter Gewinn: {lastPrize.prize} Gebote</Text>
          </View>
        )}
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
    padding: 20,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 45,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  pointer: {
    position: 'absolute',
    top: 10,
    zIndex: 10,
  },
  wheel: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#F59E0B',
  },
  wheelInner: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
    position: 'relative',
  },
  wheelSection: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    left: '25%',
    top: 0,
    transformOrigin: 'bottom center',
    alignItems: 'center',
    paddingTop: 20,
  },
  wheelText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wheelCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    borderRadius: 30,
    backgroundColor: '#1F2937',
    borderWidth: 4,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelCenterText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  prizesLegend: {
    backgroundColor: '#1F2937',
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 12,
  },
  legendTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 10,
  },
  prizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
    marginBottom: 8,
  },
  prizeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  prizeText: {
    color: '#fff',
    fontSize: 11,
  },
  spinButton: {
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  spinButtonDisabled: {
    opacity: 0.7,
  },
  spinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  spinButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  stats: {
    padding: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
  },
});

export default DailySpinScreen;
