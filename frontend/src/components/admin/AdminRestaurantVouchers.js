// Admin Restaurant Vouchers Component
import { useState, useEffect } from 'react';
import { Utensils, Plus, ExternalLink, Trash2, Copy, Loader2, MapPin, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

export default function AdminRestaurantVouchers({ token, API }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [newRestaurant, setNewRestaurant] = useState({
    restaurant_name: '',
    restaurant_url: '',
    restaurant_logo: '',
    restaurant_address: '',
    voucher_value: 25,
    discount_percent: 0,
    description: 'Genießen Sie ein leckeres Essen bei uns!',
    valid_days: 90,
    quantity: 5
  });

  // Fetch existing restaurant vouchers
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/vouchers/restaurants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVouchers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Create restaurant vouchers
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!newRestaurant.restaurant_name) {
      toast.error('Bitte Restaurant-Name eingeben');
      return;
    }
    
    setCreating(true);
    try {
      const response = await fetch(`${API}/admin/vouchers/restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRestaurant)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Fehler beim Erstellen');
      }
      
      const data = await response.json();
      toast.success(`🍽️ ${data.vouchers.length} Restaurant-Gutscheine für "${data.restaurant}" erstellt!`);
      
      // Reset form
      setNewRestaurant({
        restaurant_name: '',
        restaurant_url: '',
        restaurant_logo: '',
        restaurant_address: '',
        voucher_value: 25,
        discount_percent: 0,
        description: 'Genießen Sie ein leckeres Essen bei uns!',
        valid_days: 90,
        quantity: 5
      });
      setShowForm(false);
      fetchVouchers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Copy voucher code
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} kopiert!`);
  };

  // Group vouchers by restaurant
  const groupedVouchers = vouchers.reduce((acc, v) => {
    const name = v.merchant_name || 'Unbekannt';
    if (!acc[name]) {
      acc[name] = {
        name,
        url: v.merchant_url,
        logo: v.merchant_logo,
        address: v.merchant_address,
        vouchers: []
      };
    }
    acc[name].vouchers.push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Utensils className="w-8 h-8 text-orange-500" />
          Restaurant-Gutscheine
        </h1>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Restaurant hinzufügen
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
        <p className="text-orange-200">
          🍽️ <strong>Restaurant-Gutscheine</strong> - Erstelle Gutscheine für Partner-Restaurants. 
          Jeder Gutschein enthält einen Link zum Restaurant für Werbezwecke.
        </p>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-800/80 rounded-xl p-6 border border-orange-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-500" />
            Neues Restaurant hinzufügen
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Restaurant Name */}
            <div className="space-y-2">
              <Label className="text-white">Restaurant-Name *</Label>
              <Input 
                value={newRestaurant.restaurant_name}
                onChange={(e) => setNewRestaurant({...newRestaurant, restaurant_name: e.target.value})}
                className="bg-[#0F0F16] border-white/10 text-white"
                placeholder="z.B. Pizza Roma"
                required
              />
            </div>
            
            {/* Restaurant URL */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-1">
                <Globe className="w-4 h-4" />
                Website-URL
              </Label>
              <Input 
                value={newRestaurant.restaurant_url}
                onChange={(e) => setNewRestaurant({...newRestaurant, restaurant_url: e.target.value})}
                className="bg-[#0F0F16] border-white/10 text-white"
                placeholder="https://www.pizzaroma.de"
                type="url"
              />
            </div>
            
            {/* Restaurant Address */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Adresse
              </Label>
              <Input 
                value={newRestaurant.restaurant_address}
                onChange={(e) => setNewRestaurant({...newRestaurant, restaurant_address: e.target.value})}
                className="bg-[#0F0F16] border-white/10 text-white"
                placeholder="Musterstraße 1, 12345 Berlin"
              />
            </div>
            
            {/* Logo URL */}
            <div className="space-y-2">
              <Label className="text-white">Logo-URL (optional)</Label>
              <Input 
                value={newRestaurant.restaurant_logo}
                onChange={(e) => setNewRestaurant({...newRestaurant, restaurant_logo: e.target.value})}
                className="bg-[#0F0F16] border-white/10 text-white"
                placeholder="https://..."
                type="url"
              />
            </div>
            
            {/* Voucher Value */}
            <div className="space-y-2">
              <Label className="text-white">Gutschein-Wert (€)</Label>
              <Input 
                type="number"
                value={newRestaurant.voucher_value}
                onChange={(e) => setNewRestaurant({...newRestaurant, voucher_value: parseInt(e.target.value) || 0})}
                className="bg-[#0F0F16] border-white/10 text-white"
                min="1"
              />
            </div>
            
            {/* Discount Percent */}
            <div className="space-y-2">
              <Label className="text-white">Rabatt % (optional)</Label>
              <Input 
                type="number"
                value={newRestaurant.discount_percent}
                onChange={(e) => setNewRestaurant({...newRestaurant, discount_percent: parseInt(e.target.value) || 0})}
                className="bg-[#0F0F16] border-white/10 text-white"
                min="0"
                max="100"
                placeholder="z.B. 20"
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-white">Beschreibung</Label>
              <Input 
                value={newRestaurant.description}
                onChange={(e) => setNewRestaurant({...newRestaurant, description: e.target.value})}
                className="bg-[#0F0F16] border-white/10 text-white"
                placeholder="Genießen Sie ein leckeres Essen..."
              />
            </div>
            
            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-white">Anzahl Gutscheine</Label>
              <Input 
                type="number"
                value={newRestaurant.quantity}
                onChange={(e) => setNewRestaurant({...newRestaurant, quantity: parseInt(e.target.value) || 1})}
                className="bg-[#0F0F16] border-white/10 text-white"
                min="1"
                max="100"
              />
            </div>
            
            {/* Valid Days */}
            <div className="space-y-2">
              <Label className="text-white">Gültigkeit (Tage)</Label>
              <Input 
                type="number"
                value={newRestaurant.valid_days}
                onChange={(e) => setNewRestaurant({...newRestaurant, valid_days: parseInt(e.target.value) || 30})}
                className="bg-[#0F0F16] border-white/10 text-white"
                min="1"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={creating}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {creating ? 'Erstelle...' : 'Gutscheine erstellen'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowForm(false)}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {/* Restaurant List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : Object.keys(groupedVouchers).length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Utensils className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Noch keine Restaurant-Gutscheine vorhanden</p>
          <p className="text-sm">Klicke oben auf "Restaurant hinzufügen" um zu starten</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedVouchers).map((restaurant) => (
            <div key={restaurant.name} className="bg-gray-800/80 rounded-xl overflow-hidden border border-gray-700">
              {/* Restaurant Header */}
              <div className="bg-gradient-to-r from-orange-600/30 to-red-600/30 p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {restaurant.logo ? (
                      <img src={restaurant.logo} alt={restaurant.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Utensils className="w-6 h-6 text-orange-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{restaurant.name}</h3>
                      {restaurant.address && (
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {restaurant.address}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {restaurant.url && (
                    <a 
                      href={restaurant.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website besuchen
                    </a>
                  )}
                </div>
              </div>
              
              {/* Vouchers */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {restaurant.vouchers.map((v) => (
                    <div 
                      key={v.id} 
                      className={`p-3 rounded-lg border ${
                        v.used_count > 0 
                          ? 'bg-gray-700/30 border-gray-600 opacity-50' 
                          : 'bg-gray-700/50 border-orange-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-white font-bold">{v.code}</span>
                        <button 
                          onClick={() => copyCode(v.code)}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        <p>💰 €{v.value} Wert</p>
                        {v.discount_percent > 0 && <p>🏷️ {v.discount_percent}% Rabatt</p>}
                        <p>📅 Gültig bis: {new Date(v.expires_at).toLocaleDateString('de-DE')}</p>
                        <p className={v.used_count > 0 ? 'text-red-400' : 'text-green-400'}>
                          {v.used_count > 0 ? '❌ Eingelöst' : '✅ Verfügbar'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
