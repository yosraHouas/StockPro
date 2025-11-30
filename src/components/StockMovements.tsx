import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  reference_number: string;
  notes: string;
  created_at: string;
  products: { name: string; sku: string } | null;
  warehouses: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    movement_type: 'IN' as 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT',
    quantity: '',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [movementsResult, productsResult, warehousesResult] = await Promise.all([
        supabase
          .from('stock_movements')
          .select('*, products(name, sku), warehouses(name)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('products').select('id, name, sku').eq('is_active', true),
        supabase.from('warehouses').select('id, name'),
      ]);

      if (movementsResult.data) setMovements(movementsResult.data);
      if (productsResult.data) setProducts(productsResult.data);
      if (warehousesResult.data) setWarehouses(warehousesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const movementData = {
      product_id: formData.product_id,
      warehouse_id: formData.warehouse_id,
      movement_type: formData.movement_type,
      quantity: parseInt(formData.quantity),
      reference_number: formData.reference_number,
      notes: formData.notes,
    };

    try {
      await supabase.from('stock_movements').insert([movementData]);

      const { data: currentStock } = await supabase
        .from('stock_levels')
        .select('*')
        .eq('product_id', formData.product_id)
        .eq('warehouse_id', formData.warehouse_id)
        .maybeSingle();

      const quantityChange =
        formData.movement_type === 'IN' || formData.movement_type === 'ADJUSTMENT'
          ? parseInt(formData.quantity)
          : -parseInt(formData.quantity);

      if (currentStock) {
        await supabase
          .from('stock_levels')
          .update({
            quantity: currentStock.quantity + quantityChange,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentStock.id);
      } else {
        await supabase.from('stock_levels').insert([
          {
            product_id: formData.product_id,
            warehouse_id: formData.warehouse_id,
            quantity: Math.max(0, quantityChange),
          },
        ]);
      }

      loadData();
      resetForm();
    } catch (error) {
      console.error('Error creating movement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      warehouse_id: '',
      movement_type: 'IN',
      quantity: '',
      reference_number: '',
      notes: '',
    });
    setShowForm(false);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'OUT':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'TRANSFER':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      case 'ADJUSTMENT':
        return <RefreshCw className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: 'Entrée',
      OUT: 'Sortie',
      TRANSFER: 'Transfert',
      ADJUSTMENT: 'Ajustement',
    };
    return labels[type] || type;
  };

  const getMovementBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      IN: 'bg-green-100 text-green-800',
      OUT: 'bg-red-100 text-red-800',
      TRANSFER: 'bg-blue-100 text-blue-800',
      ADJUSTMENT: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mouvements de Stock</h2>
          <p className="text-gray-600 mt-1">Suivre les entrées et sorties de stock</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Mouvement
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Nouveau mouvement de stock</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                  <select
                    required
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entrepôt *</label>
                  <select
                    required
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner...</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    required
                    value={formData.movement_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        movement_type: e.target.value as 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IN">Entrée</option>
                    <option value="OUT">Sortie</option>
                    <option value="TRANSFER">Transfert</option>
                    <option value="ADJUSTMENT">Ajustement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de référence</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrepôt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun mouvement trouvé</p>
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(movement.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementBadgeColor(
                            movement.movement_type
                          )}`}
                        >
                          {getMovementTypeLabel(movement.movement_type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {movement.products && (
                        <div>
                          <div className="font-medium">{movement.products.name}</div>
                          <div className="text-gray-500 text-xs">{movement.products.sku}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {movement.warehouses?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {movement.movement_type === 'OUT' ? '-' : '+'}
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {movement.reference_number || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
