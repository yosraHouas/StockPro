import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  FileText,
  Calendar,
  Building2,
  Package,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PurchaseOrder {
  id: string;
  po_number: string;
  order_date: string;
  expected_date: string | null;
  status: 'DRAFT' | 'PENDING' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  notes: string;
  suppliers: {
    id: string;
    name: string;
  } | null;
  warehouses: {
    id: string;
    name: string;
  } | null;
}

interface OrderItem {
  id?: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  products?: {
    id: string;
    name: string;
    sku: string;
    unit_of_measure: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_of_measure: string;
  cost_price: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    po_number: '',
    supplier_id: '',
    warehouse_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    status: 'DRAFT' as const,
    notes: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchWarehouses();
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          order_date,
          expected_date,
          status,
          total_amount,
          notes,
          suppliers (id, name),
          warehouses (id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as PurchaseOrder[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
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

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, unit_of_measure, cost_price')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(`
          id,
          product_id,
          quantity_ordered,
          quantity_received,
          unit_price,
          products (id, name, sku, unit_of_measure)
        `)
        .eq('purchase_order_id', orderId);

      if (error) throw error;
      setOrderItems(data as OrderItem[]);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.po_number.toLowerCase().includes(term) ||
          order.suppliers?.name.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const generatePONumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PO${year}${month}${random}`;
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', order?: PurchaseOrder) => {
    setModalMode(mode);
    if (order) {
      setSelectedOrder(order);
      setFormData({
        po_number: order.po_number,
        supplier_id: order.suppliers?.id || '',
        warehouse_id: order.warehouses?.id || '',
        order_date: order.order_date,
        expected_date: order.expected_date || '',
        status: order.status,
        notes: order.notes,
      });
      fetchOrderItems(order.id);
    } else {
      setSelectedOrder(null);
      setFormData({
        po_number: generatePONumber(),
        supplier_id: '',
        warehouse_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        status: 'DRAFT',
        notes: '',
      });
      setOrderItems([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      {
        product_id: '',
        quantity_ordered: 0,
        quantity_received: 0,
        unit_price: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...orderItems];
    if (field === 'product_id' && typeof value === 'string') {
      updated[index] = { ...updated[index], product_id: value };
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].unit_price = product.cost_price;
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + item.quantity_ordered * item.unit_price;
    }, 0);
  };

  const handleSave = async () => {
    try {
      const total = calculateTotal();

      if (modalMode === 'create') {
        const { data: orderData, error: orderError } = await supabase
          .from('purchase_orders')
          .insert({
            po_number: formData.po_number,
            supplier_id: formData.supplier_id,
            warehouse_id: formData.warehouse_id,
            order_date: formData.order_date,
            expected_date: formData.expected_date || null,
            status: formData.status,
            total_amount: total,
            notes: formData.notes,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        if (orderItems.length > 0) {
          const items = orderItems.map((item) => ({
            purchase_order_id: orderData.id,
            product_id: item.product_id,
            quantity_ordered: item.quantity_ordered,
            quantity_received: item.quantity_received,
            unit_price: item.unit_price,
          }));

          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(items);

          if (itemsError) throw itemsError;
        }
      } else if (modalMode === 'edit' && selectedOrder) {
        const { error: orderError } = await supabase
          .from('purchase_orders')
          .update({
            supplier_id: formData.supplier_id,
            warehouse_id: formData.warehouse_id,
            order_date: formData.order_date,
            expected_date: formData.expected_date || null,
            status: formData.status,
            total_amount: total,
            notes: formData.notes,
          })
          .eq('id', selectedOrder.id);

        if (orderError) throw orderError;

        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('purchase_order_id', selectedOrder.id);

        if (orderItems.length > 0) {
          const items = orderItems.map((item) => ({
            purchase_order_id: selectedOrder.id,
            product_id: item.product_id,
            quantity_ordered: item.quantity_ordered,
            quantity_received: item.quantity_received,
            unit_price: item.unit_price,
          }));

          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(items);

          if (itemsError) throw itemsError;
        }
      }

      await fetchOrders();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Erreur lors de la sauvegarde de la commande');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      await fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-blue-100 text-blue-800',
      RECEIVED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const labels = {
      DRAFT: 'Brouillon',
      PENDING: 'En attente',
      RECEIVED: 'Reçu',
      CANCELLED: 'Annulé',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Commandes d'achat</h1>
          <p className="text-gray-600 mt-1">Gérez vos bons de commande fournisseurs</p>
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle commande
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="PENDING">En attente</option>
            <option value="RECEIVED">Reçu</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrepôt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date attendue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucune commande trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{order.po_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.suppliers?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.warehouses?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.expected_date ? new Date(order.expected_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {order.total_amount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal('view', order)}
                          className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal('edit', order)}
                          className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create'
                  ? 'Nouvelle commande'
                  : modalMode === 'edit'
                  ? 'Modifier la commande'
                  : 'Détails de la commande'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    N° Commande
                  </label>
                  <input
                    type="text"
                    value={formData.po_number}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Fournisseur
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Package className="w-4 h-4 inline mr-1" />
                    Entrepôt
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Sélectionner un entrepôt</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date commande
                  </label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date attendue
                  </label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="PENDING">En attente</option>
                    <option value="RECEIVED">Reçu</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={modalMode === 'view'}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Articles</h3>
                  {modalMode !== 'view' && (
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {orderItems.map((item, index) => {
                    const product = products.find((p) => p.id === item.product_id);
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Sélectionner un produit</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          value={item.quantity_ordered}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity_ordered', parseFloat(e.target.value) || 0)
                          }
                          disabled={modalMode === 'view'}
                          placeholder="Qté"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />

                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
                          }
                          disabled={modalMode === 'view'}
                          placeholder="Prix"
                          step="0.01"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />

                        <span className="w-24 text-right font-medium text-gray-900">
                          {(item.quantity_ordered * item.unit_price).toFixed(2)} €
                        </span>

                        {modalMode !== 'view' && (
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {orderItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <div className="text-lg font-bold text-gray-900">
                      Total: {calculateTotal().toFixed(2)} €
                    </div>
                  </div>
                )}
              </div>
            </div>

            {modalMode !== 'view' && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
