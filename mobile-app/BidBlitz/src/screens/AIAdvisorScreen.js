import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../services/api';

const AIAdvisorScreen = ({ route }) => {
  const auctionId = route?.params?.auctionId || 'demo';
  const [prediction, setPrediction] = useState(null);
  const [hotAuctions, setHotAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [predRes, hotRes] = await Promise.all([
        api.get(`/ai-advisor/predict/${auctionId}`).catch(() => null),
        api.get('/ai-advisor/hot-auctions').catch(() => ({ data: [] })),
      ]);
      
      if (predRes?.data) {
        setPrediction(predRes.data);
      } else {
        // Demo prediction
        setPrediction({
          current_price: 2.50,
          prediction: {
            min_price: 3.20,
            likely_price: 4.80,
            max_price: 7.50,
            confidence: 78,
          },
          win_probability: 45,
          recommendation: {
            action: 'WAIT',
            emoji: '⏳',
            message: 'Preis steigt noch. Warte noch etwas.',
            urgency: 'medium',
          },
          insights: [
            { type: 'savings', icon: '💰', title: 'Ersparnis-Potenzial', value: 'Bis zu 95% sparen (€950)' },
            { type: 'competition', icon: '😊', title: 'Wettbewerb', value: 'Niedrig (8 Gebote bisher)' },
            { type: 'timing', icon: '⏰', title: 'Beste Zeit zum Bieten', value: 'In den letzten 30 Sekunden' },
          ],
        });
      }
      
      setHotAuctions(hotRes?.data || []);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#8B5CF6';
      default: return '#10B981';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>KI analysiert...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.header}
      >
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={35} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>KI-Preisberater</Text>
        <Text style={styles.headerSubtitle}>
          Intelligente Analysen für bessere Entscheidungen
        </Text>
      </LinearGradient>

      {prediction && (
        <>
          {/* Recommendation Card */}
          <View style={[styles.recommendCard, { borderColor: getUrgencyColor(prediction.recommendation?.urgency) }]}>
            <Text style={styles.recommendEmoji}>{prediction.recommendation?.emoji}</Text>
            <Text style={styles.recommendTitle}>{prediction.recommendation?.action}</Text>
            <Text style={styles.recommendMessage}>{prediction.recommendation?.message}</Text>
          </View>

          {/* Price Prediction */}
          <View style={styles.predictionCard}>
            <Text style={styles.sectionTitle}>Preis-Vorhersage</Text>
            
            <View style={styles.priceRange}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Minimum</Text>
                <Text style={styles.priceValue}>€{prediction.prediction?.min_price?.toFixed(2)}</Text>
              </View>
              <View style={[styles.priceItem, styles.priceItemHighlight]}>
                <Text style={styles.priceLabel}>Wahrscheinlich</Text>
                <Text style={[styles.priceValue, styles.priceValueHighlight]}>
                  €{prediction.prediction?.likely_price?.toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Maximum</Text>
                <Text style={styles.priceValue}>€{prediction.prediction?.max_price?.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.confidenceBar}>
              <Text style={styles.confidenceLabel}>Konfidenz:</Text>
              <View style={styles.confidenceTrack}>
                <View style={[styles.confidenceFill, { width: `${prediction.prediction?.confidence}%` }]} />
              </View>
              <Text style={styles.confidenceValue}>{prediction.prediction?.confidence}%</Text>
            </View>
          </View>

          {/* Win Probability */}
          <View style={styles.probabilityCard}>
            <View style={styles.probabilityCircle}>
              <Text style={styles.probabilityValue}>{prediction.win_probability}%</Text>
              <Text style={styles.probabilityLabel}>Gewinnchance</Text>
            </View>
          </View>

          {/* Insights */}
          <View style={styles.insightsCard}>
            <Text style={styles.sectionTitle}>KI-Einblicke</Text>
            {prediction.insights?.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightValue}>{insight.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Hot Auctions */}
      <View style={styles.hotSection}>
        <Text style={styles.sectionTitle}>🔥 Hot Auctions</Text>
        <Text style={styles.sectionSubtitle}>Beste Gewinnchancen jetzt</Text>
        
        {hotAuctions.length > 0 ? (
          hotAuctions.map((item, index) => (
            <TouchableOpacity key={index} style={styles.hotAuction}>
              <View style={styles.hotRank}>
                <Text style={styles.hotRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.hotInfo}>
                <Text style={styles.hotName}>{item.auction?.product?.name || 'Produkt'}</Text>
                <Text style={styles.hotReason}>{item.reason}</Text>
              </View>
              <View style={styles.hotChance}>
                <Text style={styles.hotChanceValue}>{item.win_chance}</Text>
                <Text style={styles.hotChanceLabel}>Chance</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noHotText}>Keine Hot Auctions verfügbar</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8B5CF6',
    marginTop: 15,
    fontSize: 16,
  },
  header: {
    padding: 25,
    alignItems: 'center',
  },
  aiIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  recommendCard: {
    backgroundColor: '#1F2937',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
  },
  recommendEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  recommendTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recommendMessage: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  predictionCard: {
    backgroundColor: '#1F2937',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
  },
  priceRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    alignItems: 'center',
    flex: 1,
  },
  priceItemHighlight: {
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
  },
  priceLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 5,
  },
  priceValue: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceValueHighlight: {
    color: '#10B981',
    fontSize: 20,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  confidenceLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  confidenceTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  confidenceValue: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  probabilityCard: {
    backgroundColor: '#1F2937',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  probabilityCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  probabilityValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  probabilityLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  insightsCard: {
    backgroundColor: '#1F2937',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  insightValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hotSection: {
    backgroundColor: '#1F2937',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  hotAuction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  hotRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotRankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hotInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hotName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  hotReason: {
    color: '#6B7280',
    fontSize: 11,
  },
  hotChance: {
    alignItems: 'center',
  },
  hotChanceValue: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hotChanceLabel: {
    color: '#6B7280',
    fontSize: 10,
  },
  noHotText: {
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
});

export default AIAdvisorScreen;
