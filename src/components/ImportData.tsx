import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';

type DataType = 'products' | 'categories' | 'suppliers' | 'warehouses';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportData() {
  const [dataType, setDataType] = useState<DataType>('products');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    try {
      const data = await parseFile(selectedFile);
      setPreview(data.slice(0, 5));
    } catch (error) {
      console.error('Error parsing file:', error);
      setPreview([]);
    }
  };

  const parseFile = async (file: File): Promise<any[]> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      const text = await file.text();
      return JSON.parse(text);
    } else if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(firstSheet);
    }

    throw new Error('Format de fichier non supporté');
  };

  const validateAndTransformData = (data: any[], type: DataType): any[] => {
    switch (type) {
      case 'products':
        return data.map((item) => ({
          sku: item.sku || item.SKU || '',
          name: item.name || item.nom || item.Name || '',
          description: item.description || item.Description || '',
          unit_price: parseFloat(item.unit_price || item.prix || item.price || 0),
          cost_price: parseFloat(item.cost_price || item.cout || item.cost || 0),
          reorder_level: parseInt(item.reorder_level || item.niveau_min || item.min || 0),
          unit_of_measure: item.unit_of_measure || item.unite || item.unit || 'pcs',
          is_active: true,
        }));

      case 'categories':
        return data.map((item) => ({
          name: item.name || item.nom || item.Name || '',
          description: item.description || item.Description || '',
        }));

      case 'suppliers':
        return data.map((item) => ({
          name: item.name || item.nom || item.Name || '',
          contact_name: item.contact_name || item.contact || item.Contact || '',
          email: item.email || item.Email || '',
          phone: item.phone || item.telephone || item.Phone || '',
        }));

      case 'warehouses':
        return data.map((item) => ({
          name: item.name || item.nom || item.Name || '',
          location: item.location || item.emplacement || item.Location || '',
          capacity: parseInt(item.capacity || item.capacite || item.Capacity || 0),
        }));

      default:
        return [];
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const rawData = await parseFile(file);
      const transformedData = validateAndTransformData(rawData, dataType);

      for (let i = 0; i < transformedData.length; i++) {
        try {
          const { error } = await supabase.from(dataType).insert([transformedData[i]]);
          if (error) throw error;
          successCount++;
        } catch (error: any) {
          errors.push(`Ligne ${i + 1}: ${error.message}`);
        }
      }

      setResult({
        success: successCount,
        failed: errors.length,
        errors: errors.slice(0, 10),
      });
    } catch (error: any) {
      setResult({
        success: 0,
        failed: 1,
        errors: [error.message],
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    setPreview([]);
  };

  const getTableName = (type: DataType): string => {
    const names = {
      products: 'Produits',
      categories: 'Catégories',
      suppliers: 'Fournisseurs',
      warehouses: 'Entrepôts',
    };
    return names[type];
  };

  const getExampleFormat = (type: DataType): string => {
    const formats = {
      products: `{
  "sku": "PROD-001",
  "name": "Nom du produit",
  "description": "Description",
  "unit_price": 99.99,
  "cost_price": 50.00,
  "reorder_level": 10,
  "unit_of_measure": "pcs"
}`,
      categories: `{
  "name": "Électronique",
  "description": "Produits électroniques"
}`,
      suppliers: `{
  "name": "Fournisseur ABC",
  "contact_name": "Jean Dupont",
  "email": "contact@abc.com",
  "phone": "514-555-0100"
}`,
      warehouses: `{
  "name": "Entrepôt Principal",
  "location": "Montréal, QC",
  "capacity": 10000
}`,
    };
    return formats[type];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Importer des données</h3>
        <p className="text-gray-600 mt-1">Importez vos données depuis CSV, Excel ou JSON</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de données</label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as DataType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={importing}
            >
              <option value="products">Produits</option>
              <option value="categories">Catégories</option>
              <option value="suppliers">Fournisseurs</option>
              <option value="warehouses">Entrepôts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier (CSV, Excel, JSON)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Choisir un fichier...'}
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={importing}
                />
              </label>
              {file && (
                <button
                  onClick={resetImport}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  disabled={importing}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {preview.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Aperçu ({preview.length} premières lignes)
              </h4>
              <div className="overflow-x-auto">
                <pre className="text-xs text-blue-800 whitespace-pre-wrap">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {result && (
            <div
              className={`border rounded-lg p-4 ${
                result.failed === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.failed === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4
                    className={`text-sm font-medium ${
                      result.failed === 0 ? 'text-green-900' : 'text-orange-900'
                    }`}
                  >
                    Import terminé
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      result.failed === 0 ? 'text-green-700' : 'text-orange-700'
                    }`}
                  >
                    {result.success} ligne(s) importée(s) avec succès
                    {result.failed > 0 && `, ${result.failed} échec(s)`}
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-orange-900">Erreurs:</p>
                      <ul className="text-xs text-orange-700 mt-1 space-y-1">
                        {result.errors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                        {result.failed > 10 && (
                          <li>• ... et {result.failed - 10} autres erreurs</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {importing ? 'Import en cours...' : `Importer ${getTableName(dataType)}`}
            </button>
            <button
              onClick={resetImport}
              disabled={importing}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Format attendu pour {getTableName(dataType)}
        </h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <pre className="text-xs text-gray-700 overflow-x-auto">
            {getExampleFormat(dataType)}
          </pre>
        </div>
        <div className="mt-3 text-xs text-gray-600 space-y-1">
          <p>• Les fichiers CSV et Excel seront automatiquement convertis</p>
          <p>• Les noms de colonnes peuvent être en français ou anglais</p>
          <p>• Les données manquantes utiliseront des valeurs par défaut</p>
        </div>
      </div>
    </div>
  );
}
