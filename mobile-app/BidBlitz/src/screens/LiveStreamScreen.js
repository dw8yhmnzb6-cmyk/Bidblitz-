import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../services/api';

const LiveStreamScreen = ({ navigation }) => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchStreams();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchStreams = async () => {
    try {
      const response = await api.get('/live-stream/active');
      setStreams(response.data || []);
    } catch (error) {
      console.log('Error fetching streams:', error);
      // Demo data
      setStreams([
        {
          id: '1',
          title: 'iPhone 15 Pro Max LIVE!',
          host_name: 'BidBlitz Team',
          viewer_count: 234,
          current_price: 12.50,
          thumbnail: 'https://via.placeholder.com/300x200',
        },
        {
          id: '2',
          title: 'PS5 Auktion JETZT',
          host_name: 'Sarah',
          viewer_count: 156,
          current_price: 8.30,
          thumbnail: 'https://via.placeholder.com/300x200',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const joinStream = async (stream) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('LiveStreamDetail', { stream });
  };

  const renderStream = ({ item }) => (
    <TouchableOpacity 
      style={styles.streamCard}
      onPress={() => joinStream(item)}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.thumbnail || 'https://via.placeholder.com/300x200' }}
          style={styles.thumbnail}
        />
        <View style={styles.liveOverlay}>
          <Animated.View style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </Animated.View>
          <View style={styles.viewerBadge}>
            <Ionicons name="eye" size={14} color="#fff" />
            <Text style={styles.viewerCount}>{item.viewer_count}</Text>
          </View>
        </View>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        <View style={styles.streamInfo}>
          <Text style={styles.streamTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.hostName}>{item.host_name}</Text>
        </View>
      </View>
      <View style={styles.priceBar}>
        <Text style={styles.priceLabel}>Aktueller Preis:</Text>
        <Text style={styles.price}>€{item.current_price?.toFixed(2)}</Text>
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
        <View style={styles.headerContent}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.headerLiveBadge}>
              <View style={styles.headerLiveDot} />
              <Text style={styles.headerLiveText}>LIVE</Text>
            </View>
          </Animated.View>
          <Text style={styles.headerTitle}>Live Auktionen</Text>
          <Text style={styles.headerSubtitle}>
            Sei live dabei und biete in Echtzeit!
          </Text>
        </View>
      </LinearGradient>

      {/* Stream List */}
      <FlatList
        data={streams}
        renderItem={renderStream}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.streamList}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="videocam-off" size={60} color="#374151" />
            <Text style={styles.emptyText}>Keine Live-Streams aktiv</Text>
            <Text style={styles.emptySubtext}>Schau später wieder vorbei!</Text>
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
    paddingTop: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  headerLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  headerLiveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  streamList: {
    padding: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  streamCard: {
    width: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#374151',
  },
  liveOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewerCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  streamInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  streamTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  hostName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  priceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#374151',
  },
  priceLabel: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  price: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 5,
  },
});

export default LiveStreamScreen;
