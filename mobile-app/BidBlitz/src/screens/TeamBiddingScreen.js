import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../services/api';

const TeamBiddingScreen = ({ navigation }) => {
  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/team-bidding/my-teams');
      setTeams(response.data || []);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Team-Namen ein');
      return;
    }
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await api.post('/team-bidding/create', {
        name: teamName,
        auction_id: 'demo-auction',
        max_members: 5,
      });
      
      if (response.data?.invite_code) {
        Alert.alert(
          '🎉 Team erstellt!',
          `Dein Einladungscode: ${response.data.invite_code}\n\nTeile diesen Code mit deinen Freunden!`,
          [
            { text: 'Kopieren & Teilen', onPress: () => shareInvite(response.data.invite_code) },
            { text: 'OK' }
          ]
        );
        setShowCreate(false);
        setTeamName('');
        fetchTeams();
      }
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Team erstellen fehlgeschlagen');
    }
  };

  const joinTeam = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Einladungscode ein');
      return;
    }
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await api.post('/team-bidding/join', {
        invite_code: inviteCode.toUpperCase(),
      });
      
      Alert.alert('🎉 Beigetreten!', response.data?.message || 'Du bist dem Team beigetreten!');
      setShowJoin(false);
      setInviteCode('');
      fetchTeams();
    } catch (error) {
      Alert.alert('Fehler', error.response?.data?.detail || 'Beitritt fehlgeschlagen');
    }
  };

  const shareInvite = async (code) => {
    try {
      await Share.share({
        message: `⚔️ Tritt meinem BidBlitz Team bei!\n\nEinladungscode: ${code}\n\nLade die App herunter und biete mit mir zusammen!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const renderTeam = ({ item }) => (
    <TouchableOpacity 
      style={styles.teamCard}
      onPress={() => navigation.navigate('TeamDetail', { team: item })}
    >
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.teamHeader}
      >
        <View style={styles.teamIcon}>
          <Ionicons name="people" size={24} color="#fff" />
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamMembers}>
            {item.members?.length || 0}/{item.max_members || 5} Mitglieder
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'recruiting' ? '#10B981' : '#F59E0B' }]}>
          <Text style={styles.statusText}>
            {item.status === 'recruiting' ? 'Offen' : 'Aktiv'}
          </Text>
        </View>
      </LinearGradient>
      
      <View style={styles.teamBody}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Ionicons name="wallet" size={18} color="#8B5CF6" />
            <Text style={styles.statValue}>{item.total_bids_pool || 0}</Text>
            <Text style={styles.statLabel}>Gebote-Pool</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="flame" size={18} color="#EF4444" />
            <Text style={styles.statValue}>{item.bids_used || 0}</Text>
            <Text style={styles.statLabel}>Verwendet</Text>
          </View>
        </View>
        
        {item.auction && (
          <View style={styles.auctionInfo}>
            <Text style={styles.auctionLabel}>Aktuelle Auktion:</Text>
            <Text style={styles.auctionName}>{item.auction.product?.name || 'Keine'}</Text>
          </View>
        )}
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
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={40} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Team Bidding</Text>
        <Text style={styles.headerSubtitle}>
          Biete gemeinsam mit Freunden und teile den Gewinn!
        </Text>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add-circle" size={24} color="#10B981" />
          <Text style={styles.actionText}>Team erstellen</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowJoin(true)}
        >
          <Ionicons name="enter" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Team beitreten</Text>
        </TouchableOpacity>
      </View>

      {/* Create Team Modal */}
      {showCreate && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎯 Neues Team erstellen</Text>
            <TextInput
              style={styles.input}
              placeholder="Team-Name"
              placeholderTextColor="#6B7280"
              value={teamName}
              onChangeText={setTeamName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreate(false)}
              >
                <Text style={styles.cancelText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={createTeam}
              >
                <Text style={styles.confirmText}>Erstellen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Join Team Modal */}
      {showJoin && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔑 Team beitreten</Text>
            <TextInput
              style={styles.input}
              placeholder="Einladungscode (z.B. ABC123)"
              placeholderTextColor="#6B7280"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowJoin(false)}
              >
                <Text style={styles.cancelText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={joinTeam}
              >
                <Text style={styles.confirmText}>Beitreten</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Teams List */}
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.teamList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color="#374151" />
            <Text style={styles.emptyText}>Noch keine Teams</Text>
            <Text style={styles.emptySubtext}>
              Erstelle ein Team oder tritt einem bei!
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
    padding: 25,
    alignItems: 'center',
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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
    backgroundColor: '#1F2937',
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  teamList: {
    padding: 15,
  },
  teamCard: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  teamIcon: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamMembers: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  teamBody: {
    padding: 15,
    backgroundColor: '#374151',
  },
  statRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  auctionInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  auctionLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  auctionName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
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
  confirmButton: {
    backgroundColor: '#8B5CF6',
  },
  cancelText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
    textAlign: 'center',
  },
});

export default TeamBiddingScreen;
