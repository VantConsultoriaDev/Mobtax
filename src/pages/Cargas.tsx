import React, { useState, useMemo } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useModal } from '../hooks/useModal';
import { format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import {
  Plus,
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Edit,
  Trash2,
  RefreshCw,
  Link
} from 'lucide-react';

const Cargas: React.FC = () => {
  const { 
    cargas, 
    createCarga, 
    updateCarga, 
    deleteCarga,
    parceiros,
    motoristas,
    veiculos
  } = useDatabase();

  const [showForm, setShowForm] = useState(false);
  const [editingCarga, setEditingCarga] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<any>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingCarga, setLinkingCarga] = useState<any>(null);
  const [selectedParceiro, setSelectedParceiro] = useState('');
  const [selectedMotorista, setSelectedMotorista] = useState('');
  const [selectedVeiculo, setSelectedVeiculo] = useState('');

  const [formData, setFormData] = useState<{
    crt: string;
    origem: string;
    destino: string;
    dataColeta: string;
    dataEntrega: string;
    valor: string;
    peso: string;
    observacoes: string;
    status: 'entregue' | 'em_transito' | 'a_coletar' | 'armazenada' | 'cancelada';
  }>({
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
        const cargaDate = new Date(carga.dataColeta || new Date());
        const startDate = new Date(filterStartDate);
        const endDate = new Date(filterEndDate);
        matchesDateRange = isWithinInterval(cargaDate, { start: startDate, end: endDate });
      } else if (filterStartDate) {
        const cargaDate = new Date(carga.dataColeta || new Date());
        const startDate = new Date(filterStartDate);
        matchesDateRange = cargaDate >= startDate;
      } else if (filterEndDate) {
        const cargaDate = new Date(carga.dataColeta || new Date());
        const endDate = new Date(filterEndDate);
        matchesDateRange = cargaDate <= endDate;
      }
      
      return matchSearch && matchStatus && matchesDateRange;
    }).sort((a, b) => new Date(b.dataColeta || new Date()).getTime() - new Date(a.dataColeta || new Date()).getTime());
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
      descricao: formData.crt || 'Carga sem descrição',
      origem: formData.origem,
      destino: formData.destino,
      peso: parseFloat(formData.peso),
      valor: parseCurrency(formData.valor),
      dataColeta: new Date(formData.dataColeta),
      dataEntrega: new Date(formData.dataEntrega),
      status: formData.status,
      crt: formData.crt
    };

    if (editingCarga) {
      updateCarga(editingCarga.id, cargaData);
    } else {
      createCarga(cargaData);
    }

    resetForm();
  };

  const resetForm = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
      return;
    }
    
    performReset();
  };

  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Detectar se há mudanças comparando com os dados originais
    if (originalFormData) {
      const hasChanges = Object.keys(newFormData).some(key => 
        (newFormData as any)[key] !== (originalFormData as any)[key]
      );
      setHasUnsavedChanges(hasChanges);
    }
  };

  const performReset = () => {
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
    setHasUnsavedChanges(false);
    setOriginalFormData(null);
    setShowCancelConfirm(false);
  };

  const handleEdit = (carga: any) => {
    const formDataToSet = {
      crt: carga.crt || carga.descricao || '',
      origem: carga.origem,
      destino: carga.destino,
      dataColeta: format(new Date(carga.dataColeta), 'yyyy-MM-dd'),
      dataEntrega: format(new Date(carga.dataEntrega), 'yyyy-MM-dd'),
      valor: formatCurrency(carga.valor.toString()),
      peso: carga.peso.toString(),
      observacoes: carga.observacoes || '',
      status: carga.status
    };
    
    setFormData(formDataToSet);
    setOriginalFormData(formDataToSet);
    setEditingCarga(carga);
    setShowForm(true);
    setHasUnsavedChanges(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta carga?')) {
      deleteCarga(id);
    }
  };

  const handleChangeStatus = (id: string, newStatus: 'entregue' | 'em_transito' | 'a_coletar' | 'armazenada' | 'cancelada') => {
    updateCarga(id, { status: newStatus });
    setShowStatusDropdown(null);
  };

  const handleLinkParceiro = (carga: any) => {
    setLinkingCarga(carga);
    setSelectedParceiro(carga.parceiroId || '');
    setSelectedMotorista(carga.motoristaId || '');
    setSelectedVeiculo(carga.veiculoId || '');
    setShowLinkModal(true);
  };

  const handleSaveLink = () => {
    if (linkingCarga) {
      updateCarga(linkingCarga.id, {
        parceiroId: selectedParceiro || undefined,
        motoristaId: selectedMotorista || undefined,
        veiculoId: selectedVeiculo || undefined
      });
      setShowLinkModal(false);
      setLinkingCarga(null);
      setSelectedParceiro('');
      setSelectedMotorista('');
      setSelectedVeiculo('');
    }
  };

  const filteredMotoristas = useMemo(() => {
    if (!selectedParceiro) {
      // Retorna motoristas + parceiros PF que são motoristas
      const parceiroMotoristas = parceiros
        .filter(p => p.tipo === 'PF' && p.isMotorista)
        .map(p => ({
          id: p.id,
          parceiroId: p.id,
          nome: p.nome || '',
          cpf: p.documento || '',
          cnh: p.cnh || '',
          categoriaCnh: '',
          validadeCnh: new Date(),
          telefone: p.telefone || '',
          isActive: p.isActive,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }));
      return [...motoristas, ...parceiroMotoristas];
    }
    
    // Se um parceiro específico foi selecionado
    const motoristasDoParceiro = motoristas.filter(m => m.parceiroId === selectedParceiro);
    
    // Verifica se o próprio parceiro é motorista
    const parceiro = parceiros.find(p => p.id === selectedParceiro);
    if (parceiro && parceiro.tipo === 'PF' && parceiro.isMotorista) {
      const parceiroComoMotorista = {
        id: parceiro.id,
        parceiroId: parceiro.id,
        nome: parceiro.nome || '',
        cpf: parceiro.documento || '',
        cnh: parceiro.cnh || '',
        categoriaCnh: '',
        validadeCnh: new Date(),
        telefone: parceiro.telefone || '',
        isActive: parceiro.isActive,
        createdAt: parceiro.createdAt,
        updatedAt: parceiro.updatedAt
      };
      return [...motoristasDoParceiro, parceiroComoMotorista];
    }
    
    return motoristasDoParceiro;
  }, [selectedParceiro, motoristas, parceiros]);

  const filteredVeiculos = useMemo(() => {
    if (!selectedParceiro) return veiculos;
    return veiculos.filter(v => v.parceiroId === selectedParceiro);
  }, [selectedParceiro, veiculos]);

  // Seleção automática de veículo quando motorista é selecionado
  React.useEffect(() => {
    if (selectedMotorista) {
      // Verifica se o motorista selecionado é um parceiro-motorista
      const motoristaData = filteredMotoristas.find(m => m.id === selectedMotorista);
      if (motoristaData) {
        // Se for um parceiro-motorista (id do motorista = id do parceiro)
        if (motoristaData.id === motoristaData.parceiroId) {
          // Busca veículo vinculado ao parceiro
          const veiculoDoParceiro = veiculos.find(v => v.parceiroId === motoristaData.parceiroId);
          if (veiculoDoParceiro) {
            setSelectedVeiculo(veiculoDoParceiro.id);
          }
        } else {
          // Para motoristas tradicionais, busca por veiculoVinculado
          const motoristaCompleto = motoristas.find(m => m.id === selectedMotorista);
          if (motoristaCompleto?.veiculoVinculado) {
            setSelectedVeiculo(motoristaCompleto.veiculoVinculado);
          }
        }
      }
    }
  }, [selectedMotorista, filteredMotoristas, veiculos, motoristas]);



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cargas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestão de cargas e transportes</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setHasUnsavedChanges(false);
            setOriginalFormData(null);
          }}
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
                  Veículo
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
                      {carga.dataColeta ? format(new Date(carga.dataColeta), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {carga.dataEntrega ? format(new Date(carga.dataEntrega), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatCurrency(carga.valor || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {carga.veiculoId ? 
                        (() => {
                          const veiculo = veiculos.find(v => v.id === carga.veiculoId);
                          return veiculo ? veiculo.placa : 'Veículo não encontrado';
                        })() 
                        : '-'
                      }
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
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({
                                top: rect.bottom + window.scrollY + 5,
                                left: rect.left + window.scrollX - 150
                              });
                              setShowStatusDropdown(showStatusDropdown === carga.id ? null : carga.id);
                            }}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Alterar status"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleLinkParceiro(carga)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="Vincular parceiro/motorista"
                        >
                          <Link className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(carga.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Excluir"
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
                      onChange={(e) => handleFormChange('crt', e.target.value.slice(0, 10))}
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
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'entregue' | 'em_transito' | 'a_coletar' | 'armazenada' | 'cancelada' })}
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
                      onChange={(e) => handleFormChange('origem', e.target.value)}
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
                      onChange={(e) => handleFormChange('destino', e.target.value)}
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

      {/* Dropdown de status sobreposto */}
      {showStatusDropdown && dropdownPosition && (
        <>
          {/* Overlay para fechar o dropdown ao clicar fora */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowStatusDropdown(null);
              setDropdownPosition(null);
            }}
          />
          {/* Dropdown sobreposto */}
          <div 
            className="fixed z-50 w-48 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 border border-gray-100 dark:border-gray-600"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
          >
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                Alterar Status
              </div>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleChangeStatus(showStatusDropdown, key as 'entregue' | 'em_transito' | 'a_coletar' | 'armazenada' | 'cancelada')}
                  className={`w-full flex items-center px-4 py-3 text-sm transition-colors ${
                    filteredCargas.find(c => c.id === showStatusDropdown)?.status === key 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {React.createElement(cfg.icon, { 
                    className: `h-4 w-4 mr-3 ${
                      filteredCargas.find(c => c.id === showStatusDropdown)?.status === key ? 'text-blue-600 dark:text-blue-400' : cfg.textColor
                    }` 
                  })}
                  <span className="flex-1 text-left">{cfg.label}</span>
                  {filteredCargas.find(c => c.id === showStatusDropdown)?.status === key && (
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal de vinculação */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vincular Parceiro/Motorista
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parceiro
                </label>
                <select
                  value={selectedParceiro}
                  onChange={(e) => {
                    setSelectedParceiro(e.target.value);
                    setSelectedMotorista('');
                    setSelectedVeiculo('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione um parceiro</option>
                  {parceiros.map(parceiro => (
                    <option key={parceiro.id} value={parceiro.id}>
                      {parceiro.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motorista
                </label>
                <select
                  value={selectedMotorista}
                  onChange={(e) => setSelectedMotorista(e.target.value)}
                  disabled={!selectedParceiro}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                >
                  <option value="">Selecione um motorista</option>
                  {filteredMotoristas.map(motorista => (
                    <option key={motorista.id} value={motorista.id}>
                      {motorista.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Veículo
                </label>
                <select
                  value={selectedVeiculo}
                  onChange={(e) => setSelectedVeiculo(e.target.value)}
                  disabled={!selectedParceiro}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                >
                  <option value="">Selecione um veículo</option>
                  {filteredVeiculos.map(veiculo => (
                    <option key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa} - {veiculo.modelo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação para cancelar */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar Cancelamento
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Você tem alterações não salvas. Tem certeza que deseja cancelar? Todas as alterações serão perdidas.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Continuar Editando
              </button>
              <button
                onClick={performReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Descartar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cargas;
