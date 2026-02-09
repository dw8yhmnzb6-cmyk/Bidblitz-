import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const WatchersScreen = ({ navigation }) => {
  const [hotAuctions, setHotAuctions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [hotRes, statsRes] = await Promise.all([
        api.get('/watchers/hot-auctions?limit=20'),
        api.get('/watchers/stats'),
      ]);
      
      setHotAuctions(hotRes.data?.hot_auctions || []);
      setStats(statsRes.data);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAuction = ({ item, index }) => (
    <TouchableOpacity
      style={styles.auctionCard}
      onPress={() => navigation.navigate('AuctionDetail', { auctionId: item.id })}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      
      <Image
        source={{ uri: item.product_image || 'https://via.placeholder.com/80' }}
        style={styles.productImage}
      />
      
      <View style={styles.auctionInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product_name}
        </Text>
        <Text style={styles.priceText}>
          €{item.current_price?.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.watchersContainer}>
        <Ionicons name="eye" size={20} color="#8B5CF6" />
        <Text style={styles.watchersCount}>{item.watchers || 0}</Text>
        <Text style={styles.watchersLabel}>Zuschauer</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.header}
      >
        <Ionicons name="eye" size={48} color="#fff" />
        <Text style={styles.headerTitle}>Live Zuschauer</Text>
        <Text style={styles.headerSubtitle}>
          Sieh was andere gerade anschauen
        </Text>
      </LinearGradient>

      {/* Stats Row */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_viewers}</Text>
            <Text style={styles.statLabel}>Aktive Zuschauer</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.auctions_being_watched}</Text>
            <Text style={styles.statLabel}>Auktionen</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.average_per_auction}</Text>
            <Text style={styles.statLabel}>Ø pro Auktion</Text>
          </View>
        </View>
      )}

      {/* Live Indicator */}
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE - Meistbeobachtete Auktionen</Text>
      </View>

      {/* Hot Auctions List */}
      <FlatList
        data={hotAuctions}
        renderItem={renderAuction}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchData}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="telescope" size={64} color="#6B7280" />
            <Text style={styles.emptyTitle}>Keine aktiven Zuschauer</Text>
            <Text style={styles.emptyText}>
              Sei der Erste der eine Auktion beobachtet!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  auctionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  auctionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  watchersContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  watchersCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  watchersLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default WatchersScreen;
