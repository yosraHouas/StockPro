import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, AlertTriangle, TrendingUp, Warehouse, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  totalWarehouses: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorder_level: number;
}

interface StockByWarehouse {
  warehouse: string;
  quantity: number;
}

interface MovementByType {
  type: string;
  count: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStock: 0,
    lowStockItems: 0,
    totalWarehouses: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [stockByWarehouse, setStockByWarehouse] = useState<StockByWarehouse[]>([]);
  const [movementsByType, setMovementsByType] = useState<MovementByType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [productsResult, stockResult, warehousesResult] = await Promise.all([
        supabase.from('products').select('id, name, sku, reorder_level'),
        supabase.from('stock_levels').select('quantity'),
        supabase.from('warehouses').select('id'),
      ]);

      const products = productsResult.data || [];
      const stockLevels = stockResult.data || [];
      const warehouses = warehousesResult.data || [];

      const totalStock = stockLevels.reduce((sum, item) => sum + item.quantity, 0);

      const lowStock = products.filter(product => {
        const totalQty = stockLevels
          .filter(sl => sl.quantity)
          .reduce((sum, sl) => sum + sl.quantity, 0);
        return totalQty <= product.reorder_level;
      });

      setStats({
        totalProducts: products.length,
        totalStock,
        lowStockItems: lowStock.length,
        totalWarehouses: warehouses.length,
      });

      const lowStockWithQuantities: LowStockProduct[] = await Promise.all(
        lowStock.slice(0, 5).map(async (product) => {
          const { data: stockData } = await supabase
            .from('stock_levels')
            .select('quantity')
            .eq('product_id', product.id);

          const totalQty = (stockData || []).reduce((sum, item) => sum + item.quantity, 0);

          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            quantity: totalQty,
            reorder_level: product.reorder_level,
          };
        })
      );

      setLowStockProducts(lowStockWithQuantities);

      const { data: stockLevelsWithWarehouse } = await supabase
        .from('stock_levels')
        .select('quantity, warehouses(name)');

      if (stockLevelsWithWarehouse) {
        const warehouseData: Record<string, number> = {};
        stockLevelsWithWarehouse.forEach((item: any) => {
          const name = item.warehouses?.name || 'Sans entrepôt';
          warehouseData[name] = (warehouseData[name] || 0) + item.quantity;
        });
        setStockByWarehouse(
          Object.entries(warehouseData).map(([warehouse, quantity]) => ({
            warehouse,
            quantity,
          }))
        );
      }

      const { data: movements } = await supabase
        .from('stock_movements')
        .select('movement_type')
        .order('created_at', { ascending: false })
        .limit(100);

      if (movements) {
        const movementCounts: Record<string, number> = {};
        movements.forEach((m: any) => {
          movementCounts[m.movement_type] = (movementCounts[m.movement_type] || 0) + 1;
        });
        const typeLabels: Record<string, string> = {
          IN: 'Entrées',
          OUT: 'Sorties',
          TRANSFER: 'Transferts',
          ADJUSTMENT: 'Ajustements',
        };
        setMovementsByType(
          Object.entries(movementCounts).map(([type, count]) => ({
            type: typeLabels[type] || type,
            count,
          }))
        );
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de bord</h2>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre inventaire</p>
        </div>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BarChart3 className="w-5 h-5" />
          {showCharts ? 'Masquer graphiques' : 'Afficher graphiques'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Produits</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStock}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bas</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.lowStockItems}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entrepôts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalWarehouses}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <Warehouse className="w-8 h-8 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock par entrepôt</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockByWarehouse}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="warehouse" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mouvements récents</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={movementsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) =>
                    `${type}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {movementsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Produits à Réapprovisionner
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Niveau Min
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {product.reorder_level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        Réapprovisionner
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
