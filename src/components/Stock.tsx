import { useState, useEffect } from 'react';
import { Package, Search, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StockItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  products: {
    id: string;
    sku: string;
    name: string;
    reorder_level: number;
    unit_of_measure: string;
    categories: {
      name: string;
    } | null;
  };
  warehouses: {
    name: string;
    location: string;
  };
}

interface ProductStock {
  product_id: string;
  sku: string;
  name: string;
  category: string;
  unit_of_measure: string;
  reorder_level: number;
  total_quantity: number;
  total_available: number;
  total_reserved: number;
  warehouses: Array<{
    warehouse_id: string;
    warehouse_name: string;
    warehouse_location: string;
    quantity: number;
    available_quantity: number;
    reserved_quantity: number;
  }>;
  status: 'low' | 'normal' | 'good';
}

export default function Stock() {
  const [stockData, setStockData] = useState<ProductStock[]>([]);
  const [filteredData, setFilteredData] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchStockData();
    fetchCategories();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stockData, searchTerm, categoryFilter, warehouseFilter, statusFilter]);

  const fetchStockData = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_levels')
        .select(`
          id,
          product_id,
          warehouse_id,
          quantity,
          available_quantity,
          reserved_quantity,
          products (
            id,
            sku,
            name,
            reorder_level,
            unit_of_measure,
            categories (
              name
            )
          ),
          warehouses (
            name,
            location
          )
        `);

      if (error) throw error;

      const grouped = groupByProduct(data as StockItem[]);
      setStockData(grouped);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByProduct = (items: StockItem[]): ProductStock[] => {
    const productMap = new Map<string, ProductStock>();

    items.forEach((item) => {
      const productId = item.product_id;

      if (!productMap.has(productId)) {
        const totalQty = items
          .filter((i) => i.product_id === productId)
          .reduce((sum, i) => sum + i.quantity, 0);

        const totalAvailable = items
          .filter((i) => i.product_id === productId)
          .reduce((sum, i) => sum + i.available_quantity, 0);

        const totalReserved = items
          .filter((i) => i.product_id === productId)
          .reduce((sum, i) => sum + i.reserved_quantity, 0);

        const status =
          totalQty === 0 ? 'low' :
          totalQty <= item.products.reorder_level ? 'low' :
          totalQty <= item.products.reorder_level * 2 ? 'normal' : 'good';

        productMap.set(productId, {
          product_id: productId,
          sku: item.products.sku,
          name: item.products.name,
          category: item.products.categories?.name || 'Sans catégorie',
          unit_of_measure: item.products.unit_of_measure,
          reorder_level: item.products.reorder_level,
          total_quantity: totalQty,
          total_available: totalAvailable,
          total_reserved: totalReserved,
          warehouses: [],
          status,
        });
      }

      const product = productMap.get(productId)!;
      product.warehouses.push({
        warehouse_id: item.warehouse_id,
        warehouse_name: item.warehouses.name,
        warehouse_location: item.warehouses.location,
        quantity: item.quantity,
        available_quantity: item.available_quantity,
        reserved_quantity: item.reserved_quantity,
      });
    });

    return Array.from(productMap.values());
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');

      if (error) throw error;
      setCategories(data?.map((c) => c.name) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...stockData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    if (warehouseFilter !== 'all') {
      filtered = filtered.filter((item) =>
        item.warehouses.some((w) => w.warehouse_id === warehouseFilter)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredData(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Stock bas
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Minus className="w-3 h-3 mr-1" />
            Normal
          </span>
        );
      case 'good':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <TrendingUp className="w-3 h-3 mr-1" />
            Bon
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Niveaux de stock</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble des stocks par produit et entrepôt</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les entrepôts</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="low">Stock bas</option>
            <option value="normal">Normal</option>
            <option value="good">Bon</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disponible
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réservé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Par entrepôt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucun produit trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {item.total_quantity} {item.unit_of_measure}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-green-600">
                      {item.total_available} {item.unit_of_measure}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-orange-600">
                      {item.total_reserved} {item.unit_of_measure}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {item.warehouses.map((wh) => (
                          <div
                            key={wh.warehouse_id}
                            className="text-sm text-gray-600 flex items-center justify-between"
                          >
                            <span className="font-medium">{wh.warehouse_name}:</span>
                            <span className="ml-2">
                              {wh.quantity} {item.unit_of_measure}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredData.length} produit(s) affiché(s)</span>
            <div className="flex items-center gap-6">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                Stock bas: {filteredData.filter((i) => i.status === 'low').length}
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                Normal: {filteredData.filter((i) => i.status === 'normal').length}
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                Bon: {filteredData.filter((i) => i.status === 'good').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
