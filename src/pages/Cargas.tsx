import React, { useState, useMemo } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useModal } from '../hooks/useModal';
import { format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Filter, 
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Edit,
  Trash2,
  X,
  Eye,
  MoreVertical
} from 'lucide-react';

const Cargas: React.FC = () => {
  const { 
    cargas, 
    createCarga, 
    updateCarga, 
    deleteCarga
  } = useDatabase();

  const [showForm, setShowForm] = useState(false);
  const [editingCarga, setEditingCarga] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    crt: '',
    origem: '',
    destino: '',
    dataColeta: format(new Date(), 'yyyy-MM-dd'),
    dataEntrega: format(new Date(), 'yyyy-MM-dd'),
    valor: '',
    peso: '',
    observacoes: '',
    status: 'a_coletar'
  });

  // Hook para gerenciar fechamento do modal
  const { modalRef } = useModal({
    isOpen: showForm,
    onClose: () => {
      setShowForm(false);
      setEditingCarga(null);
      setFormData({
        crt: '',
        origem: '',
        destino: '',
        dataColeta: format(new Date(), 'yyyy-MM-dd'),
        dataEntrega: format(new Date(), 'yyyy-MM-dd'),
        valor: '',
        peso: '',
        observacoes: '',
        status: 'a_coletar'
      });
    }
  });

  // Status com cores e ícones atualizados
  const statusConfig = {
    a_coletar: { 
      label: 'À coletar', 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      icon: Clock
    },
    em_transito: { 
      label: 'Em trânsito', 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      icon: Truck
    },
    armazenada: { 
      label: 'Armazenada', 
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      icon: Package
    },
    entregue: { 
      label: 'Entregue', 
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      icon: CheckCircle
    },
    cancelada: { 
      label: 'Cancelada', 
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      icon: AlertTriangle
    }
  };

  // Filtrar cargas
  const filteredCargas = useMemo(() => {
    return cargas.filter(carga => {
      const matchSearch = carga.crt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carga.origem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carga.destino?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = !filterStatus || carga.status === filterStatus;
      
      // Filtro por intervalo de datas (usando dataColeta como referência)
      let matchesDateRange = true;
      if (filterStartDate && filterEndDate) {
        const cargaDate = new Date(carga.dataColeta);
        const startDate = new Date(filterStartDate);
        const endDate = new Date(filterEndDate);
        matchesDateRange = isWithinInterval(cargaDate, { start: startDate, end: endDate });
      } else if (filterStartDate) {
        const cargaDate = new Date(carga.dataColeta);
        const startDate = new Date(filterStartDate);
        matchesDateRange = cargaDate >= startDate;
      } else if (filterEndDate) {
        const cargaDate = new Date(carga.dataColeta);
        const endDate = new Date(filterEndDate);
        matchesDateRange = cargaDate <= endDate;
      }
      
      return matchSearch && matchStatus && matchesDateRange;
    }).sort((a, b) => new Date(b.dataColeta).getTime() - new Date(a.dataColeta).getTime());
  }, [cargas, searchTerm, filterStatus, filterStartDate, filterEndDate]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = cargas.length;
    const aColetar = cargas.filter(c => c.status === 'a_coletar').length;
    const emTransito = cargas.filter(c => c.status === 'em_transito').length;
    const armazenadas = cargas.filter(c => c.status === 'armazenada').length;
    const entregues = cargas.filter(c => c.status === 'entregue').length;
    const valorTotal = cargas.reduce((sum, c) => sum + (c.valor || 0), 0);
    
    return { total, aColetar, emTransito, armazenadas, entregues, valorTotal };
  }, [cargas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar CRT (máximo 10 caracteres)
    if (formData.crt.length > 10) {
      alert('CRT deve ter no máximo 10 caracteres');
      return;
    }
    
    const cargaData = {
      ...formData,
      valor: parseCurrency(formData.valor),
      peso: parseFloat(formData.peso),
      id: editingCarga?.id || undefined
    };

    if (editingCarga) {
      updateCarga(editingCarga.id, cargaData);
    } else {
      createCarga(cargaData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      crt: '',
      origem: '',
      destino: '',
      dataColeta: format(new Date(), 'yyyy-MM-dd'),
      dataEntrega: format(new Date(), 'yyyy-MM-dd'),
      valor: '',
      peso: '',
      observacoes: '',
      status: 'a_coletar'
    });
    setEditingCarga(null);
    setShowForm(false);
  };

  const handleEdit = (carga: any) => {
    setFormData({
      crt: carga.crt || carga.descricao || '',
      origem: carga.origem,
      destino: carga.destino,
      dataColeta: format(new Date(carga.dataColeta), 'yyyy-MM-dd'),
      dataEntrega: format(new Date(carga.dataEntrega), 'yyyy-MM-dd'),
      valor: formatCurrency(carga.valor.toString()),
      peso: carga.peso.toString(),
      observacoes: carga.observacoes || '',
      status: carga.status
    });
    setEditingCarga(carga);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta carga?')) {
      deleteCarga(id);
    }
  };

  const handleChangeStatus = (id: string, newStatus: string) => {
    updateCarga(id, { status: newStatus });
    setShowStatusDropdown(null);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cargas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestão de cargas e transportes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Carga
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* À Coletar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">À Coletar</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.aColetar}</p>
            </div>
          </div>
        </div>

        {/* Em Trânsito */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Trânsito</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.emTransito}</p>
            </div>
          </div>
        </div>

        {/* Armazenadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Armazenadas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.armazenadas}</p>
            </div>
          </div>
        </div>

        {/* Entregues */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregues</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.entregues}</p>
            </div>
          </div>
        </div>

        {/* Valor Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.valorTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por CRT, origem ou destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filtro Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos os status</option>
            {Object.entries(statusConfig).map(([status, config]) => (
              <option key={status} value={status}>{config.label}</option>
            ))}
          </select>

          {/* Data Início */}
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Data início"
          />

          {/* Data Fim */}
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Data fim"
          />
        </div>
      </div>

      {/* Tabela de Cargas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                  Data Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCargas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma carga encontrada
                  </td>
                </tr>
              ) : (
                filteredCargas.map((carga) => (
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
                      {format(new Date(carga.dataEntrega), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatCurrency(carga.valor || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[carga.status as keyof typeof statusConfig].color}`}>
                        {statusConfig[carga.status as keyof typeof statusConfig].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 items-center">
                        <button
                          onClick={() => handleEdit(carga)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShowStatusDropdown(showStatusDropdown === carga.id ? null : carga.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Alterar status"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {showStatusDropdown === carga.id && (
                            <div className="absolute right-0 mt-2 w-44 z-50 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                {Object.entries(statusConfig).map(([key, cfg]) => (
                                  <button
                                    key={key}
                                    onClick={() => handleChangeStatus(carga.id, key)}
                                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    {React.createElement(cfg.icon, { className: `h-4 w-4 mr-2 ${cfg.textColor}` })}
                                    {cfg.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(carga.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCarga ? 'Editar Carga' : 'Nova Carga'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CRT
                    </label>
                    <input
                      type="text"
                      value={formData.crt}
                      onChange={(e) => setFormData({ ...formData, crt: e.target.value.slice(0, 10) })}
                      placeholder="Ex: BR722"
                      className="input-field"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo 10 caracteres</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="a_coletar">À coletar</option>
                      <option value="em_transito">Em trânsito</option>
                      <option value="armazenada">Armazenada</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Origem *
                    </label>
                    <input
                      type="text"
                      value={formData.origem}
                      onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Destino *
                    </label>
                    <input
                      type="text"
                      value={formData.destino}
                      onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Coleta *
                    </label>
                    <input
                      type="date"
                      value={formData.dataColeta}
                      onChange={(e) => setFormData({ ...formData, dataColeta: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Entrega *
                    </label>
                    <input
                      type="date"
                      value={formData.dataEntrega}
                      onChange={(e) => setFormData({ ...formData, dataEntrega: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Peso (toneladas) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                      className="input-field"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="text"
                      value={formData.valor}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        setFormData({ ...formData, valor: formatted });
                      }}
                      className="input-field"
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Observações adicionais..."
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingCarga ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cargas;