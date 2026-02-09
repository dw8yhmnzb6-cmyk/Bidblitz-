import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Share,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../services/api';

const DuelScreen = ({ navigation }) => {
  const [duels, setDuels] = useState([]);
  const [showJoin, setShowJoin] = useState(false);
  const [duelCode, setDuelCode] = useState('');
  const [loading, setLoading] = useState(true);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchDuels();
    startShakeAnimation();
  }, []);

  const startShakeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.delay(3000),
      ])
    ).start();
  };

  const fetchDuels = async () => {
    try {
      const response = await api.get('/duel/available');
      setDuels(response.data || []);
    } catch (error) {
      console.log('Error:', error);
      // Demo duels
      setDuels([
        {
          id: '1',
          code: 'ABCD',
          product_name: 'iPhone 15 Pro',
          retail_price: 1199,
          max_bids: 20,
          duration_seconds: 120,
          player1: { name: 'Max', bids_used: 0 },
          status: 'waiting',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createDuel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const response = await api.post('/duel/create', {
        product_id: 'demo-product',
        max_bids: 20,
        duration_seconds: 120,
      });
      
      if (response.data?.duel_code) {
        Alert.alert(
          '⚔️ Duell erstellt!',
          `Dein Duell-Code: ${response.data.duel_code}\n\nFordere einen Freund heraus!`,
          [
            { 
              text: 'Teilen', 
              onPress: () => shareDuel(response.data.duel_code)
            },
            { text: 'OK' }
          ]
        );
        fetchDuels();
      }
    } catch (error) {
      Alert.alert('Fehler', 'Duell erstellen fehlgeschlagen');
    }
  };

  const joinDuel = async () => {
    if (!duelCode.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Duell-Code ein');
      return;
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const response = await api.post('/duel/join', {
        duel_code: duelCode.toUpperCase(),
      });
      
      if (response.data?.duel) {
        setShowJoin(false);
        setDuelCode('');
        Alert.alert('⚔️ Duell beginnt!', 'Bereit zum Kampf!');
        navigation.navigate('DuelBattle', { duel: response.data.duel });
      }
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Beitritt fehlgeschlagen');
    }
  };

  const shareDuel = async (code) => {
    try {
      await Share.share({
        message: `⚔️ Ich fordere dich zum Duell heraus!\n\nDuell-Code: ${code}\n\nÖffne BidBlitz und gib den Code ein!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const renderDuel = ({ item }) => (
    <TouchableOpacity 
      style={styles.duelCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('DuelBattle', { duel: item });
      }}
    >
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        style={styles.duelHeader}
      >
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Text style={styles.swordsEmoji}>⚔️</Text>
        </Animated.View>
        <View style={styles.duelInfo}>
          <Text style={styles.duelProduct}>{item.product_name}</Text>
          <Text style={styles.duelPrice}>UVP: €{item.retail_price}</Text>
        </View>
        <View style={styles.duelCode}>
          <Text style={styles.duelCodeText}>{item.code}</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.duelBody}>
        <View style={styles.duelStats}>
          <View style={styles.duelStat}>
            <Ionicons name="flash" size={18} color="#F59E0B" />
            <Text style={styles.duelStatValue}>{item.max_bids}</Text>
            <Text style={styles.duelStatLabel}>Max Gebote</Text>
          </View>
          <View style={styles.duelStat}>
            <Ionicons name="timer" size={18} color="#8B5CF6" />
            <Text style={styles.duelStatValue}>{item.duration_seconds}s</Text>
            <Text style={styles.duelStatLabel}>Dauer</Text>
          </View>
        </View>
        
        <View style={styles.playersRow}>
          <View style={styles.player}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerInitial}>{item.player1?.name?.charAt(0) || '?'}</Text>
            </View>
            <Text style={styles.playerName}>{item.player1?.name || 'Wartet...'}</Text>
          </View>
          
          <Text style={styles.vsText}>VS</Text>
          
          <View style={styles.player}>
            <View style={[styles.playerAvatar, !item.player2 && styles.playerAvatarEmpty]}>
              <Text style={styles.playerInitial}>{item.player2?.name?.charAt(0) || '?'}</Text>
            </View>
            <Text style={styles.playerName}>{item.player2?.name || 'Wartet...'}</Text>
          </View>
        </View>
        
        {item.status === 'waiting' && !item.player2 && (
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Herausforderung annehmen!</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        style={styles.header}
      >
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Text style={styles.headerEmoji}>⚔️</Text>
        </Animated.View>
        <Text style={styles.headerTitle}>Auktions-Duell</Text>
        <Text style={styles.headerSubtitle}>
          1 vs 1 - Wer gewinnt das Produkt?
        </Text>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.createButton]}
          onPress={createDuel}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Duell starten</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.joinActionButton]}
          onPress={() => setShowJoin(true)}
        >
          <Ionicons name="enter" size={24} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Code eingeben</Text>
        </TouchableOpacity>
      </View>

      {/* Join Modal */}
      {showJoin && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚔️ Duell beitreten</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Duell-Code (z.B. ABCD)"
              placeholderTextColor="#6B7280"
              value={duelCode}
              onChangeText={setDuelCode}
              autoCapitalize="characters"
              maxLength={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowJoin(false)}
              >
                <Text style={styles.cancelText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.fightButton]}
                onPress={joinDuel}
              >
                <Text style={styles.fightText}>KÄMPFEN!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Duels List */}
      <FlatList
        data={duels}
        renderItem={renderDuel}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.duelList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⚔️</Text>
            <Text style={styles.emptyText}>Keine offenen Duelle</Text>
            <Text style={styles.emptySubtext}>Starte ein neues Duell!</Text>
          </View>
        }
      />

      {/* Leaderboard Teaser */}
      <TouchableOpacity style={styles.leaderboardTeaser}>
        <Ionicons name="trophy" size={20} color="#F59E0B" />
        <Text style={styles.leaderboardText}>Duell-Rangliste ansehen</Text>
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
    fontSize: 50,
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
  },
  actions: {
    flexDirection: 'row',
    padding: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  createButton: {
    backgroundColor: '#EF4444',
  },
  joinActionButton: {
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  duelList: {
    padding: 15,
  },
  duelCard: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  duelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  swordsEmoji: {
    fontSize: 30,
  },
  duelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  duelProduct: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  duelPrice: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  duelCode: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  duelCodeText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  duelBody: {
    padding: 15,
  },
  duelStats: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  duelStat: {
    flex: 1,
    alignItems: 'center',
  },
  duelStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  duelStatLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 15,
  },
  player: {
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarEmpty: {
    backgroundColor: '#4B5563',
  },
  playerInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerName: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  vsText: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    padding: 25,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 10,
    textAlign: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  fightButton: {
    backgroundColor: '#EF4444',
  },
  cancelText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  fightText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 5,
  },
  leaderboardTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  leaderboardText: {
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
});

export default DuelScreen;
