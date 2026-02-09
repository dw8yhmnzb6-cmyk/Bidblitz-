import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const WalletScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    try {
      const response = await api.get('/wallet/my-passes');
      setPasses(response.data?.passes || []);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePass = async (auctionId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await api.post(`/wallet/generate/${auctionId}`);
      Alert.alert('✅ Pass erstellt!', response.data?.message);
      fetchPasses();
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Konnte Pass nicht erstellen');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return '#F59E0B';
      case 'shipped': return '#3B82F6';
      case 'in_transit': return '#8B5CF6';
      case 'out_for_delivery': return '#EC4899';
      case 'delivered': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'processing': return 'Wird bearbeitet';
      case 'shipped': return 'Versendet';
      case 'in_transit': return 'Unterwegs';
      case 'out_for_delivery': return 'In Zustellung';
      case 'delivered': return 'Zugestellt';
      default: return 'Ausstehend';
    }
  };

  const renderPass = ({ item }) => (
    <View style={styles.passCard}>
      <View style={styles.passHeader}>
        <Image
          source={{ uri: item.product_image || 'https://via.placeholder.com/60' }}
          style={styles.productImage}
        />
        <View style={styles.passInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.wonPrice}>€{item.won_price?.toFixed(2)}</Text>
            <Text style={styles.retailPrice}>statt €{item.retail_price?.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.shipping_status) + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.shipping_status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(item.shipping_status) }]}>
          {getStatusText(item.shipping_status)}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {!item.pass_generated ? (
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={() => generatePass(item.auction_id)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Pass erstellen</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.walletBtns}>
            <TouchableOpacity style={styles.walletBtn}>
              <Ionicons name="logo-apple" size={24} color="#fff" />
              <Text style={styles.walletBtnText}>Apple Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.walletBtn, styles.googleWalletBtn]}>
              <Ionicons name="wallet" size={24} color="#fff" />
              <Text style={styles.walletBtnText}>Google Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Won Date */}
      <Text style={styles.wonDate}>
        Gewonnen am {new Date(item.won_at).toLocaleDateString('de-DE')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.header}
      >
        <Ionicons name="wallet" size={48} color="#fff" />
        <Text style={styles.headerTitle}>Digital Wallet</Text>
        <Text style={styles.headerSubtitle}>
          Deine gewonnenen Produkte als digitale Karten
        </Text>
      </LinearGradient>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Füge deine Gewinne zu Apple oder Google Wallet hinzu für einfachen Zugriff auf Versandstatus!
        </Text>
      </View>

      {/* Passes List */}
      <FlatList
        data={passes}
        renderItem={renderPass}
        keyExtractor={item => item.auction_id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchPasses}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyTitle}>Keine Gewinne</Text>
            <Text style={styles.emptyText}>
              Gewinne Auktionen um digitale Wallet-Karten zu erhalten!
            </Text>
            <TouchableOpacity 
              style={styles.browseBtn}
              onPress={() => navigation.navigate('Auctions')}
            >
              <Text style={styles.browseBtnText}>Auktionen entdecken</Text>
            </TouchableOpacity>
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
    textAlign: 'center',
    marginTop: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: '#3B82F6',
    fontSize: 12,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  passCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  passHeader: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  passInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  wonPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  retailPrice: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 16,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  walletBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  walletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  googleWalletBtn: {
    backgroundColor: '#4285F4',
  },
  walletBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  wonDate: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
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
  browseBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  browseBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default WalletScreen;
