import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../services/api';

const WinnerGalleryScreen = ({ navigation }) => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, week, month

  useEffect(() => {
    fetchWinners();
  }, [filter]);

  const fetchWinners = async () => {
    try {
      const response = await api.get(`/winner-gallery?period=${filter}`);
      setWinners(response.data || []);
    } catch (error) {
      console.log('Error:', error);
      // Demo data
      setWinners([
        {
          id: '1',
          user_name: 'Max M.',
          user_avatar: null,
          product_name: 'iPhone 15 Pro Max',
          product_image: 'https://via.placeholder.com/200',
          retail_price: 1399,
          won_price: 12.50,
          savings_percent: 99,
          photo_url: null,
          comment: 'Unglaublich! Für nur €12 bekommen!',
          likes: 234,
          won_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_name: 'Sarah K.',
          user_avatar: null,
          product_name: 'PlayStation 5',
          product_image: 'https://via.placeholder.com/200',
          retail_price: 549,
          won_price: 8.30,
          savings_percent: 98,
          photo_url: null,
          comment: 'Mein Mann hat sich so gefreut! 🎮',
          likes: 189,
          won_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_name: 'Thomas B.',
          user_avatar: null,
          product_name: 'Samsung OLED TV 65"',
          product_image: 'https://via.placeholder.com/200',
          retail_price: 1899,
          won_price: 24.70,
          savings_percent: 99,
          photo_url: null,
          comment: 'Der beste Fernseher den ich je hatte!',
          likes: 312,
          won_at: new Date().toISOString(),
        },
        {
          id: '4',
          user_name: 'Lisa H.',
          user_avatar: null,
          product_name: 'Dyson V15 Detect',
          product_image: 'https://via.placeholder.com/200',
          retail_price: 749,
          won_price: 6.80,
          savings_percent: 99,
          photo_url: null,
          comment: 'Putzen macht jetzt sogar Spaß 😂',
          likes: 156,
          won_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWinners();
  };

  const likeWinner = async (winnerId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setWinners(prev => prev.map(w => 
      w.id === winnerId ? { ...w, likes: w.likes + 1, liked: true } : w
    ));
    
    try {
      await api.post(`/winner-gallery/${winnerId}/like`);
    } catch (error) {
      console.log('Error liking:', error);
    }
  };

  const renderWinner = ({ item }) => (
    <View style={styles.winnerCard}>
      {/* User Header */}
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          {item.user_avatar ? (
            <Image source={{ uri: item.user_avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{item.user_name?.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user_name}</Text>
          <Text style={styles.wonDate}>
            {new Date(item.won_at).toLocaleDateString('de-DE')}
          </Text>
        </View>
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>-{item.savings_percent}%</Text>
        </View>
      </View>

      {/* Product Image */}
      <Image
        source={{ uri: item.product_image || item.photo_url || 'https://via.placeholder.com/300' }}
        style={styles.productImage}
      />

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product_name}</Text>
        
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>UVP</Text>
            <Text style={styles.retailPrice}>€{item.retail_price}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#6B7280" />
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Gewonnen für</Text>
            <Text style={styles.wonPrice}>€{item.won_price?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Comment */}
        {item.comment && (
          <View style={styles.commentBox}>
            <Text style={styles.commentText}>"{item.comment}"</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.likeButton, item.liked && styles.likeButtonActive]}
            onPress={() => !item.liked && likeWinner(item.id)}
          >
            <Ionicons 
              name={item.liked ? 'heart' : 'heart-outline'} 
              size={22} 
              color={item.liked ? '#EF4444' : '#9CA3AF'} 
            />
            <Text style={[styles.likeCount, item.liked && styles.likeCountActive]}>
              {item.likes}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social" size={22} color="#9CA3AF" />
            <Text style={styles.shareText}>Teilen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const FilterButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFilter(value);
      }}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F59E0B', '#EF4444']}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🏆</Text>
        <Text style={styles.headerTitle}>Gewinner-Galerie</Text>
        <Text style={styles.headerSubtitle}>
          Echte Menschen, echte Gewinne!
        </Text>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>12.847</Text>
          <Text style={styles.statLabel}>Gewinner</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>€3.2M</Text>
          <Text style={styles.statLabel}>Gespart</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>96%</Text>
          <Text style={styles.statLabel}>Ø Ersparnis</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        <FilterButton value="all" label="Alle" />
        <FilterButton value="week" label="Diese Woche" />
        <FilterButton value="month" label="Diesen Monat" />
      </View>

      {/* Winners List */}
      <FlatList
        data={winners}
        renderItem={renderWinner}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
        }
        contentContainerStyle={styles.winnersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={60} color="#374151" />
            <Text style={styles.emptyText}>Keine Gewinner gefunden</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    marginHorizontal: 15,
    marginTop: -15,
    borderRadius: 12,
    padding: 15,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    padding: 15,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1F2937',
    marginHorizontal: 3,
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#F59E0B',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  winnersList: {
    padding: 15,
    paddingTop: 0,
  },
  winnerCard: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wonDate: {
    color: '#6B7280',
    fontSize: 12,
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  savingsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#374151',
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 12,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    color: '#6B7280',
    fontSize: 10,
  },
  retailPrice: {
    color: '#9CA3AF',
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  wonPrice: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  commentBox: {
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  commentText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 15,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  likeButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  likeCount: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  likeCountActive: {
    color: '#EF4444',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 15,
  },
});

export default WinnerGalleryScreen;
