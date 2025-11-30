import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_name: string;
          email: string;
          phone: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string;
          email?: string;
          phone?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_name?: string;
          email?: string;
          phone?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          location: string;
          capacity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string;
          capacity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          capacity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string;
          category_id: string | null;
          supplier_id: string | null;
          unit_price: number;
          cost_price: number;
          reorder_level: number;
          reorder_quantity: number;
          unit_of_measure: string;
          barcode: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string;
          category_id?: string | null;
          supplier_id?: string | null;
          unit_price?: number;
          cost_price?: number;
          reorder_level?: number;
          reorder_quantity?: number;
          unit_of_measure?: string;
          barcode?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          description?: string;
          category_id?: string | null;
          supplier_id?: string | null;
          unit_price?: number;
          cost_price?: number;
          reorder_level?: number;
          reorder_quantity?: number;
          unit_of_measure?: string;
          barcode?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_levels: {
        Row: {
          id: string;
          product_id: string;
          warehouse_id: string;
          quantity: number;
          reserved_quantity: number;
          available_quantity: number;
          last_counted_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          warehouse_id: string;
          quantity?: number;
          reserved_quantity?: number;
          last_counted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          warehouse_id?: string;
          quantity?: number;
          reserved_quantity?: number;
          last_counted_at?: string | null;
          updated_at?: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          warehouse_id: string;
          movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
          quantity: number;
          reference_number: string;
          notes: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          warehouse_id: string;
          movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
          quantity: number;
          reference_number?: string;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          warehouse_id?: string;
          movement_type?: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
          quantity?: number;
          reference_number?: string;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          supplier_id: string;
          warehouse_id: string;
          order_date: string;
          expected_date: string | null;
          status: 'DRAFT' | 'PENDING' | 'RECEIVED' | 'CANCELLED';
          total_amount: number;
          notes: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          po_number: string;
          supplier_id: string;
          warehouse_id: string;
          order_date?: string;
          expected_date?: string | null;
          status?: 'DRAFT' | 'PENDING' | 'RECEIVED' | 'CANCELLED';
          total_amount?: number;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          po_number?: string;
          supplier_id?: string;
          warehouse_id?: string;
          order_date?: string;
          expected_date?: string | null;
          status?: 'DRAFT' | 'PENDING' | 'RECEIVED' | 'CANCELLED';
          total_amount?: number;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          product_id: string;
          quantity_ordered: number;
          quantity_received: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          product_id: string;
          quantity_ordered?: number;
          quantity_received?: number;
          unit_price?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          product_id?: string;
          quantity_ordered?: number;
          quantity_received?: number;
          unit_price?: number;
          created_at?: string;
        };
      };
    };
  };
};
