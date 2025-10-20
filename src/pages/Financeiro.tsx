import React, { useState, useMemo } from 'react'
import { useDatabase } from '../contexts/DatabaseContext'
import { useModal } from '../hooks/useModal'
import { format, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency, parseCurrency } from '../utils/formatters'
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  X,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

const Financeiro: React.FC = () => {
  const { 
    movimentacoes, 
    createMovimentacao, 
    updateMovimentacao, 
    deleteMovimentacao
  } = useDatabase();

  const [showForm, setShowForm] = useState(false);
  const [editingMovimentacao, setEditingMovimentacao] = useState<any>(null);
  
  // Hook para gerenciar fechamento do modal
  const { modalRef } = useModal({
    isOpen: showForm,
    onClose: () => {
      setShowForm(false);
      setEditingMovimentacao(null);
      setFormData({
        descricao: '',
        valor: '',
        tipo: 'receita',
        categoria: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        status: 'pendente',
        observacoes: ''
      });
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'receita',
    categoria: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    status: 'pendente',
    observacoes: ''
  });

  // Categorias predefinidas
  const categorias = {
    receita: [
      'Frete',
      'Serviços',
      'Comissões',
      'Outros'
    ],
    despesa: [
      'Combustível',
      'Manutenção',
      'Pedágios',
      'Salários',
      'Impostos',
      'Seguros',
      'Outros'
    ]
  };

  // Status com cores
  const statusConfig = {
    pendente: { 
      label: 'Pendente', 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: Clock
    },
    pago: { 
      label: 'Pago', 
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: CheckCircle
    },
    cancelado: { 
      label: 'Adiado', 
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: AlertTriangle
    }
  };

  // Filtrar movimentações
  const filteredMovimentacoes = useMemo(() => {
    return movimentacoes.filter(movimentacao => {
      const matchSearch = movimentacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movimentacao.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = !filterType || movimentacao.tipo === filterType;
      const matchStatus = !filterStatus || movimentacao.status === filterStatus;
      
      // Filtro por intervalo de datas
      let matchesDateRange = true;
      if (filterStartDate && filterEndDate) {
        const movimentacaoDate = new Date(movimentacao.data);
        const startDate = new Date(filterStartDate);
        const endDate = new Date(filterEndDate);
        matchesDateRange = isWithinInterval(movimentacaoDate, { start: startDate, end: endDate });
      } else if (filterStartDate) {
        const movimentacaoDate = new Date(movimentacao.data);
        const startDate = new Date(filterStartDate);
        matchesDateRange = movimentacaoDate >= startDate;
      } else if (filterEndDate) {
        const movimentacaoDate = new Date(movimentacao.data);
        const endDate = new Date(filterEndDate);
        matchesDateRange = movimentacaoDate <= endDate;
      }
      
      return matchSearch && matchType && matchStatus && matchesDateRange;
    });
  }, [movimentacoes, searchTerm, filterType, filterStatus, filterStartDate, filterEndDate]);

  // Estatísticas
  const stats = useMemo(() => {
    const receitas = movimentacoes.filter(t => t.tipo === 'receita');
    const despesas = movimentacoes.filter(t => t.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((sum, t) => sum + (t.valor || 0), 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + (t.valor || 0), 0);
    const saldo = totalReceitas - totalDespesas;
    
    const receitasPendentes = receitas.filter(t => t.status === 'pendente').reduce((sum, t) => sum + (t.valor || 0), 0);
    const despesasPendentes = despesas.filter(t => t.status === 'pendente').reduce((sum, t) => sum + (t.valor || 0), 0);
    
    return { 
      totalReceitas, 
      totalDespesas, 
      saldo, 
      receitasPendentes, 
      despesasPendentes,
      totalTransacoes: movimentacoes.length
    };
  }, [movimentacoes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const movimentacaoData = {
      ...formData,
      valor: parseCurrency(formData.valor),
      id: editingMovimentacao?.id || undefined
    };

    if (editingMovimentacao) {
      updateMovimentacao(editingMovimentacao.id, movimentacaoData);
    } else {
      createMovimentacao(movimentacaoData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      tipo: 'receita',
      categoria: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      status: 'pendente',
      observacoes: ''
    });
    setEditingMovimentacao(null);
    setShowForm(false);
  };

  const handleEdit = (movimentacao: any) => {
    setFormData({
      descricao: movimentacao.descricao,
      valor: formatCurrency(movimentacao.valor.toString()),
      tipo: movimentacao.tipo,
      categoria: movimentacao.categoria,
      data: format(new Date(movimentacao.data), 'yyyy-MM-dd'),
      status: movimentacao.status,
      observacoes: movimentacao.observacoes || ''
    });
    setEditingMovimentacao(movimentacao);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta movimentação?')) {
      deleteMovimentacao(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestão de receitas e despesas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Movimentação
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Receitas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receitas</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalReceitas)}</p>
            </div>
          </div>
        </div>

        {/* Total Despesas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalDespesas)}</p>
            </div>
          </div>
        </div>

        {/* Saldo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stats.saldo >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              <DollarSign className={`h-5 w-5 ${stats.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo</p>
              <p className={`text-lg font-bold ${stats.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.saldo)}
              </p>
            </div>
          </div>
        </div>

        {/* Receitas Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rec. Pendentes</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.receitasPendentes)}</p>
            </div>
          </div>
        </div>

        {/* Despesas Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Desp. Pendentes</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.despesasPendentes)}</p>
            </div>
          </div>
        </div>

        {/* Total Transações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalTransacoes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filtro Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>

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

      {/* Tabela de Transações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
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
              {filteredMovimentacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                filteredMovimentacoes.map((movimentacao) => (
                  <tr key={movimentacao.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {format(new Date(movimentacao.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {movimentacao.descricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {movimentacao.categoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        movimentacao.tipo === 'receita' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {movimentacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={movimentacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                        {movimentacao.tipo === 'receita' ? '+' : '-'} {formatCurrency(movimentacao.valor || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[movimentacao.status as keyof typeof statusConfig].color}`}>
                        {statusConfig[movimentacao.status as keyof typeof statusConfig].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(movimentacao)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(movimentacao.id)}
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

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingMovimentacao ? 'Editar Movimentação' : 'Nova Movimentação'}
              </h3>
              <button
                 onClick={resetForm}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Descrição da transação"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor
                </label>
                <input
                  type="text"
                  value={formData.valor}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setFormData({ ...formData, valor: formatted });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'receita' | 'despesa', categoria: '' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias[formData.tipo as keyof typeof categorias].map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Adiado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingMovimentacao ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
};

export default Financeiro;