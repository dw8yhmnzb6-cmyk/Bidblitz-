// Admin Products Tab Component
import { Plus, Edit, Save, X, Trash2, Package, Tag, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function AdminProducts({ 
  products, 
  newProduct, 
  setNewProduct, 
  editingProduct, 
  setEditingProduct,
  handleCreateProduct, 
  handleUpdateProduct, 
  handleDeleteProduct, 
  t 
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('admin.manageProducts')}</h1>
          <p className="text-slate-500 text-sm">{(products || []).length} Produkte verfügbar</p>
        </div>
      </div>

      {/* Create Product Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{t('admin.newProduct')}</h3>
        <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700">{t('admin.productName')}</Label>
            <Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required className="bg-slate-50 border-slate-200 text-slate-800" placeholder="z.B. iPhone 15 Pro" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">{t('admin.category')}</Label>
            <Input value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} required className="bg-slate-50 border-slate-200 text-slate-800" placeholder="z.B. Elektronik" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">{t('admin.imageUrl')}</Label>
            <Input value={newProduct.image_url} onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})} required className="bg-slate-50 border-slate-200 text-slate-800" placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">{t('admin.rrp')}</Label>
            <Input type="number" step="0.01" value={newProduct.retail_price} onChange={(e) => setNewProduct({...newProduct, retail_price: e.target.value})} required className="bg-slate-50 border-slate-200 text-slate-800" placeholder="999.00" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-700">{t('admin.description')}</Label>
            <Input value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} required className="bg-slate-50 border-slate-200 text-slate-800" placeholder="Produktbeschreibung..." />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="w-4 h-4 mr-2" />{t('admin.createProduct')}</Button>
          </div>
        </form>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {(products || []).map((product) => (
          <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex gap-3">
              {/* Product Image */}
              <img src={product.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{product.name}</p>
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                  <Tag className="w-3 h-3" />{product.category}
                </p>
                <p className="text-cyan-600 font-mono font-bold mt-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />€{product.retail_price?.toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => setEditingProduct({...product})} className="flex-1 bg-violet-500 hover:bg-violet-600 text-white">
                <Edit className="w-3 h-3 mr-1" />Bearbeiten
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)} className="px-3">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {(products || []).length === 0 && (
          <p className="text-center text-slate-400 py-12">Keine Produkte gefunden</p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">{t('admin.image')}</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">{t('admin.productName')}</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">{t('admin.category')}</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">{t('admin.rrp')}</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(products || []).map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" /></td>
                  <td className="px-4 py-3">{editingProduct?.id === product.id ? <Input value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="bg-slate-50 border-slate-200 text-slate-800 h-8" /> : <span className="text-slate-800 font-medium">{product.name}</span>}</td>
                  <td className="px-4 py-3">{editingProduct?.id === product.id ? <Input value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="bg-slate-50 border-slate-200 text-slate-800 h-8" /> : <span className="text-slate-500">{product.category}</span>}</td>
                  <td className="px-4 py-3">{editingProduct?.id === product.id ? <Input type="number" step="0.01" value={editingProduct.retail_price} onChange={(e) => setEditingProduct({...editingProduct, retail_price: parseFloat(e.target.value)})} className="bg-slate-50 border-slate-200 text-slate-800 h-8 w-24" /> : <span className="text-cyan-600 font-mono font-bold">€{product.retail_price?.toFixed(2)}</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {editingProduct?.id === product.id ? (
                        <>
                          <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleUpdateProduct(product.id)}><Save className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:bg-slate-100" onClick={() => setEditingProduct(null)}><X className="w-4 h-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" className="text-violet-600 hover:bg-violet-50" onClick={() => setEditingProduct({...product})}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
