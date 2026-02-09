import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Bid packages matching the backend
const BID_PACKAGES = [
  { id: 'starter', name: 'Starter', bids: 50, price: 29.99, bonus: 0, popular: false },
  { id: 'basic', name: 'Basic', bids: 100, price: 49.99, bonus: 10, popular: false },
  { id: 'popular', name: 'Beliebt', bids: 250, price: 99.99, bonus: 50, popular: true },
  { id: 'pro', name: 'Pro', bids: 500, price: 179.99, bonus: 150, popular: false },
  { id: 'premium', name: 'Premium', bids: 1000, price: 299.99, bonus: 400, popular: false },
];

const BuyBidsScreen = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const handlePurchase = async (pkg) => {
    setSelectedPackage(pkg.id);
    setLoading(true);
    
    try {
      // Create checkout session
      const response = await api.post('/checkout/create-session', {
        package_id: pkg.id,
      });
      
      if (response.data?.url) {
        // In a real app, you would open the Stripe checkout URL
        // For now, we'll show a message
        Alert.alert(
          'Weiterleitung',
          'Sie werden zur Zahlungsseite weitergeleitet. In der Web-Version würde sich jetzt Stripe öffnen.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Zahlung fehlgeschlagen');
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  const PackageCard = ({ pkg }) => {
    const totalBids = pkg.bids + pkg.bonus;
    const pricePerBid = (pkg.price / totalBids).toFixed(2);
    const isSelected = selectedPackage === pkg.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.packageCard,
          pkg.popular && styles.popularCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handlePurchase(pkg)}
        disabled={loading}
      >
        {pkg.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>BELIEBT</Text>
          </View>
        )}
        
        <View style={styles.packageHeader}>
          <Text style={styles.packageName}>{pkg.name}</Text>
          <Text style={styles.packageBids}>{pkg.bids} Gebote</Text>
        </View>
        
        {pkg.bonus > 0 && (
          <View style={styles.bonusContainer}>
            <Ionicons name="gift" size={14} color="#10B981" />
            <Text style={styles.bonusText}>+{pkg.bonus} Bonus</Text>
          </View>
        )}
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>€{pkg.price.toFixed(2)}</Text>
          <Text style={styles.pricePerBid}>€{pricePerBid}/Gebot</Text>
        </View>
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Gesamt:</Text>
          <Text style={styles.totalValue}>{totalBids} Gebote</Text>
        </View>
        
        {isSelected && loading ? (
          <ActivityIndicator color="#fff" style={styles.loadingIndicator} />
        ) : (
          <LinearGradient
            colors={pkg.popular ? ['#10B981', '#059669'] : ['#8B5CF6', '#6366F1']}
            style={styles.buyButton}
          >
            <Text style={styles.buyButtonText}>Kaufen</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.balanceCard}
      >
        <View style={styles.balanceIcon}>
          <Ionicons name="wallet" size={28} color="#fff" />
        </View>
        <View>
          <Text style={styles.balanceLabel}>Ihr Guthaben</Text>
          <Text style={styles.balanceValue}>{user?.bids_balance || user?.bids || 0} Gebote</Text>
        </View>
      </LinearGradient>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#8B5CF6" />
        <Text style={styles.infoText}>
          Je mehr Gebote Sie kaufen, desto günstiger wird der Preis pro Gebot!
        </Text>
      </View>

      {/* Packages */}
      <Text style={styles.sectionTitle}>Gebote-Pakete</Text>
      
      <View style={styles.packagesContainer}>
        {BID_PACKAGES.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </View>

      {/* Payment Methods */}
      <View style={styles.paymentSection}>
        <Text style={styles.paymentTitle}>Sichere Zahlung mit</Text>
        <View style={styles.paymentIcons}>
          <View style={styles.paymentIcon}>
            <Ionicons name="card" size={24} color="#6366F1" />
            <Text style={styles.paymentIconText}>Stripe</Text>
          </View>
          <View style={styles.paymentIcon}>
            <Ionicons name="logo-apple" size={24} color="#000" />
            <Text style={styles.paymentIconText}>Apple Pay</Text>
          </View>
          <View style={styles.paymentIcon}>
            <Ionicons name="logo-google" size={24} color="#4285F4" />
            <Text style={styles.paymentIconText}>Google Pay</Text>
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Häufige Fragen</Text>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Was ist ein Gebot?</Text>
          <Text style={styles.faqAnswer}>
            Ein Gebot ermöglicht es Ihnen, bei einer Auktion mitzubieten. 
            Jedes Gebot erhöht den Preis um 0,01€.
          </Text>
        </View>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Wie gewinne ich?</Text>
          <Text style={styles.faqAnswer}>
            Der letzte Bieter, wenn die Zeit abläuft, gewinnt das Produkt 
            zum aktuellen Preis.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    padding: 20,
    borderRadius: 15,
  },
  balanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  infoText: {
    flex: 1,
    color: '#A5B4FC',
    fontSize: 13,
    marginLeft: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  packagesContainer: {
    paddingHorizontal: 15,
  },
  packageCard: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  popularCard: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  selectedCard: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 15,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageHeader: {
    marginBottom: 10,
  },
  packageName: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  packageBids: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  bonusText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  price: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  pricePerBid: {
    color: '#6B7280',
    fontSize: 12,
    marginLeft: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  totalLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  totalValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  buyButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    padding: 14,
  },
  paymentSection: {
    backgroundColor: '#1F2937',
    margin: 15,
    padding: 20,
    borderRadius: 15,
  },
  paymentTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
  },
  paymentIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paymentIcon: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  paymentIconText: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 4,
  },
  faqSection: {
    margin: 15,
    marginTop: 5,
  },
  faqTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  faqItem: {
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  faqQuestion: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 20,
  },
});

export default BuyBidsScreen;
