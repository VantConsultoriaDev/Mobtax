import React, { useMemo } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatters';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react';

export default function Dashboard() {
  const { cargas, parceiros } = useDatabase();

  // Estatísticas de cargas por status
  const cargoStats = useMemo(() => {
    const aColeta = cargas.filter(carga => carga.status === 'a_coletar').length;
    const emTransito = cargas.filter(carga => carga.status === 'em_transito').length;
    const armazenada = cargas.filter(carga => carga.status === 'armazenada').length;
    const entregue = cargas.filter(carga => carga.status === 'entregue').length;
    const cancelada = cargas.filter(carga => carga.status === 'cancelada').length;
    
    const total = cargas.length;
    const valorTotal = cargas.reduce((sum, carga) => sum + (carga.valor || 0), 0);
    
    return { 
      aColeta, 
      emTransito, 
      armazenada, 
      entregue, 
      cancelada, 
      total,
      valorTotal
    };
  }, [cargas]);

  const statusConfig = {
    a_coletar: { label: 'À Coletar', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
    em_transito: { label: 'Em Trânsito', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Truck },
    armazenada: { label: 'Armazenada', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Package },
    entregue: { label: 'Entregue', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
    cancelada: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle }
  };

  // Cargas recentes (últimas 5)
  const cargasRecentes = useMemo(() => {
    return cargas
      .sort((a, b) => new Date(b.dataColeta).getTime() - new Date(a.dataColeta).getTime())
      .slice(0, 5);
  }, [cargas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Início</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visão geral do sistema
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Cargas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Cargas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{cargoStats.total}</p>
            </div>
          </div>
        </div>

        {/* Em Trânsito */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Truck className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Trânsito</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{cargoStats.emTransito}</p>
            </div>
          </div>
        </div>

        {/* Entregues */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregues</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{cargoStats.entregue}</p>
            </div>
          </div>
        </div>

        {/* Valor Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(cargoStats.valorTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = cargoStats[status as keyof typeof cargoStats] as number || 0;
          const Icon = config.icon;
          
          return (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
              <div className={`w-12 h-12 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabela de Cargas Recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cargas Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  CRT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Origem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data Coleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cargasRecentes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma carga cadastrada
                  </td>
                </tr>
              ) : (
                cargasRecentes.map((carga) => (
                  <tr key={carga.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {carga.crt || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {carga.origem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {carga.destino}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {format(new Date(carga.dataColeta), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatCurrency(carga.valor || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[carga.status as keyof typeof statusConfig].color} ${statusConfig[carga.status as keyof typeof statusConfig].bgColor}`}>
                        {statusConfig[carga.status as keyof typeof statusConfig].label}
                      </span>
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