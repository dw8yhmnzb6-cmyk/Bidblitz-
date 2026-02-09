import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { auctionsAPI } from '../services/api';
import api from '../services/api';

const AuctionDetailScreen = ({ route, navigation }) => {
  const { auction: initialAuction } = route.params;
  const { user, updateUser } = useAuth();
  const [auction, setAuction] = useState(initialAuction);
  const [bidding, setBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);

  useEffect(() => {
    checkIfFavorite();
  }, []);

  const checkIfFavorite = async () => {
    try {
      const response = await api.get('/favorites/my');
      const favorites = response.data || [];
      const found = favorites.find(f => f.product_id === auction.product?.id);
      if (found) {
        setIsFavorite(true);
        setFavoriteId(found.id);
      }
    } catch (error) {
      console.log('Error checking favorites:', error);
    }
  };

  const toggleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        await api.delete(`/favorites/${favoriteId}`);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        // Add to favorites
        const response = await api.post('/favorites/add', {
          product_id: auction.product?.id,
        });
        setIsFavorite(true);
        setFavoriteId(response.data?.favorite_id);
        Alert.alert('Favorit', 'Zu Favoriten hinzugefügt! ❤️');
      }
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Konnte Favorit nicht aktualisieren');
    }
  };

  useEffect(() => {
    // Update timer every second
    const timer = setInterval(() => {
      const end = new Date(auction.end_time);
      const now = new Date();
      const diff = Math.max(0, end - now);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    // Fetch updated auction data
    const fetchAuction = async () => {
      try {
        const response = await auctionsAPI.getOne(auction.id);
        setAuction(response.data);
      } catch (error) {
        console.log('Error fetching auction:', error);
      }
    };

    const dataInterval = setInterval(fetchAuction, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(dataInterval);
    };
  }, [auction.id, auction.end_time]);

  const placeBid = async () => {
    if (!user || user.bids < 1) {
      Alert.alert(
        'Keine Gebote',
        'Sie haben keine Gebote mehr. Möchten Sie welche kaufen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Gebote kaufen', onPress: () => navigation.navigate('Gebote') },
        ]
      );
      return;
    }

    setBidding(true);
    try {
      const response = await auctionsAPI.placeBid(auction.id);
      if (response.data) {
        setAuction(prev => ({
          ...prev,
          current_price: response.data.new_price || prev.current_price + 0.01,
          last_bidder_name: user.name,
        }));
        updateUser({ ...user, bids: user.bids - 1 });
        Alert.alert('Erfolg!', 'Ihr Gebot wurde platziert!');
      }
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Gebot fehlgeschlagen');
    } finally {
      setBidding(false);
    }
  };

  const product = auction.product || {};
  const discount = product.retail_price
    ? Math.round((1 - auction.current_price / product.retail_price) * 100)
    : 99;

  return (
    <ScrollView style={styles.container}>
      {/* Product Image */}
      <Image
        source={{ uri: product.image_url || 'https://via.placeholder.com/400' }}
        style={styles.productImage}
      />

      {/* Discount Badge */}
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>-{discount}%</Text>
      </View>

      {/* Favorite Button */}
      <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
        <Ionicons 
          name={isFavorite ? 'heart' : 'heart-outline'} 
          size={28} 
          color={isFavorite ? '#EF4444' : '#fff'} 
        />
      </TouchableOpacity>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <LinearGradient
          colors={['#F59E0B', '#EF4444']}
          style={styles.timerGradient}
        >
          <Ionicons name="time" size={20} color="#fff" />
          <Text style={styles.timerText}>{timeLeft}</Text>
        </LinearGradient>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.productTitle}>{product.name || 'Produkt'}</Text>
        
        <View style={styles.priceContainer}>
          <View>
            <Text style={styles.priceLabel}>Aktueller Preis</Text>
            <Text style={styles.currentPrice}>€{auction.current_price?.toFixed(2)}</Text>
          </View>
          <View style={styles.retailPriceBox}>
            <Text style={styles.priceLabel}>UVP</Text>
            <Text style={styles.retailPrice}>€{product.retail_price?.toFixed(0)}</Text>
          </View>
        </View>

        {/* Last Bidder */}
        <View style={styles.bidderContainer}>
          <Ionicons name="person" size={16} color="#9CA3AF" />
          <Text style={styles.bidderText}>
            Führender: {auction.last_bidder_name || 'Noch kein Gebot'}
          </Text>
        </View>

        {/* Bid Button */}
        <TouchableOpacity
          style={[styles.bidButton, bidding && styles.bidButtonDisabled]}
          onPress={placeBid}
          disabled={bidding}
        >
          <LinearGradient
            colors={bidding ? ['#6B7280', '#6B7280'] : ['#8B5CF6', '#6366F1']}
            style={styles.bidButtonGradient}
          >
            <Ionicons name="hammer" size={24} color="#fff" />
            <Text style={styles.bidButtonText}>
              {bidding ? 'Biete...' : 'JETZT BIETEN'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Your Bids */}
        <View style={styles.yourBidsContainer}>
          <Text style={styles.yourBidsText}>
            Ihre Gebote: {user?.bids || 0}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Gebote')}>
            <Text style={styles.buyMoreText}>Mehr kaufen →</Text>
          </TouchableOpacity>
        </View>

        {/* Product Description */}
        {product.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Beschreibung</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
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
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#1F2937',
  },
  discountBadge: {
    position: 'absolute',
    top: 15,
    right: 60,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    position: 'absolute',
    top: 260,
    left: 15,
    right: 15,
  },
  timerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  timerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoContainer: {
    padding: 20,
    paddingTop: 40,
  },
  productTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  priceLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  currentPrice: {
    color: '#10B981',
    fontSize: 32,
    fontWeight: 'bold',
  },
  retailPriceBox: {
    alignItems: 'flex-end',
  },
  retailPrice: {
    color: '#6B7280',
    fontSize: 18,
    textDecorationLine: 'line-through',
  },
  bidderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bidderText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  bidButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  bidButtonDisabled: {
    opacity: 0.7,
  },
  bidButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  yourBidsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  yourBidsText: {
    color: '#fff',
    fontSize: 14,
  },
  buyMoreText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  descriptionContainer: {
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 12,
  },
  descriptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 22,
  },
});

export default AuctionDetailScreen;
