import React, { useState, useMemo } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useModal } from '../hooks/useModal';

import { XCircle, CheckCircle, AlertTriangle, Unlink } from 'lucide-react';
import { 
  formatDocument, 
  formatPlaca
} from '../utils/formatters';

export default function Parceiros() {
  const { 
    parceiros, 
    motoristas, 
    veiculos,
    createParceiro, 
    updateParceiro, 
    deleteParceiro,
    createMotorista,
    updateMotorista,
    deleteMotorista,
    createVeiculo,
    updateVeiculo,
    deleteVeiculo,
    getMotoristasByParceiro,
    getVeiculosByParceiro
  } = useDatabase();
  
  const [selectedParceiro, setSelectedParceiro] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'veiculos' | 'motoristas'>('veiculos');
  const [showParceiroForm, setShowParceiroForm] = useState(false);
  const [showMotoristaForm, setShowMotoristaForm] = useState(false);
  const [showVeiculoForm, setShowVeiculoForm] = useState(false);
  const [showVinculacaoModal, setShowVinculacaoModal] = useState(false);
  const [vinculacaoData, setVinculacaoData] = useState<{type: 'motorista' | 'veiculo', item: any}>({type: 'motorista', item: null});

  
  const [editingParceiro, setEditingParceiro] = useState<any>(null);
  const [editingMotorista, setEditingMotorista] = useState<any>(null);
  const [editingVeiculo, setEditingVeiculo] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Filtros para veículos e motoristas
  const [veiculoSearchTerm, setVeiculoSearchTerm] = useState('');
  const [motoristaSearchTerm, setMotoristaSearchTerm] = useState('');

  // Estados para modais de confirmação de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'veiculo' | 'motorista' | 'parceiro', id: string, name: string} | null>(null);

  // Forms
  const [parceiroForm, setParceiroForm] = useState({
    nome: '',
    tipo: 'PF',
    documento: '',
    cnh: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
    isMotorista: false
  });

  const [motoristaForm, setMotoristaForm] = useState({
    nome: '',
    cpf: '',
    cnh: '',
    parceiroId: '',
    veiculoVinculado: ''
  });

  const [veiculoForm, setVeiculoForm] = useState({
    tipo: 'Truck',
    placa: '',
    placaCavalo: '',
    fabricante: '',
    modelo: '',
    ano: '',
    chassis: '',
    carroceria: '',
    quantidadeCarretas: 1,
    possuiDolly: false,
    placaCarreta: '',
    placaCarreta1: '',
    placaCarreta2: '',
    placaDolly: '',
    parceiroId: '',
    motoristaVinculado: ''
  });

  // Hooks para gerenciar fechamento dos modais
  const { modalRef: parceiroModalRef } = useModal({
    isOpen: showParceiroForm,
    onClose: () => {
      setShowParceiroForm(false);
      setEditingParceiro(null);
      setParceiroForm({
        nome: '',
        tipo: 'PF',
        documento: '',
        cnh: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
        isMotorista: false
      });
    }
  });

  const { modalRef: motoristaModalRef } = useModal({
    isOpen: showMotoristaForm,
    onClose: () => {
      setShowMotoristaForm(false);
      setEditingMotorista(null);
      setMotoristaForm({
        nome: '',
        cpf: '',
        cnh: '',
        parceiroId: '',
        veiculoVinculado: ''
      });
    }
  });

  const { modalRef: veiculoModalRef } = useModal({
    isOpen: showVeiculoForm,
    onClose: () => {
      setShowVeiculoForm(false);
      setEditingVeiculo(null);
      setVeiculoForm({
        tipo: 'Truck',
        placa: '',
        placaCavalo: '',
        fabricante: '',
        modelo: '',
        ano: '',
        chassis: '',
        carroceria: '',
        quantidadeCarretas: 1,
        possuiDolly: false,
        placaCarreta: '',
        placaCarreta1: '',
        placaCarreta2: '',
        placaDolly: '',
        parceiroId: '',
        motoristaVinculado: ''
      });
    }
  });

  const { modalRef: vinculacaoModalRef } = useModal({
    isOpen: showVinculacaoModal,
    onClose: () => {
      setShowVinculacaoModal(false);
      setVinculacaoData({type: 'motorista', item: null});
    }
  });



  // Filtrar parceiros
  const filteredParceiros = useMemo(() => {
    return parceiros.filter(parceiro => {
      const matchSearch = parceiro.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parceiro.documento?.includes(searchTerm) ||
                         parceiro.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTipo = !filterTipo || parceiro.tipo === filterTipo;
      const matchStatus = !filterStatus || 
                         (filterStatus === 'active' && parceiro.isActive) ||
                         (filterStatus === 'inactive' && !parceiro.isActive);
      
      return matchSearch && matchTipo && matchStatus;
    }).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [parceiros, searchTerm, filterTipo, filterStatus]);

  // Motoristas e veículos do parceiro selecionado
  const motoristasParceiro = useMemo(() => {
    if (!selectedParceiro) return [];
    const motoristasRegistrados = getMotoristasByParceiro(selectedParceiro.id);
    
    // Retorna apenas os motoristas registrados, sem incluir o próprio parceiro
    // mesmo que ele seja marcado como motorista (isMotorista: true)
    let todosMotoristas = [...motoristasRegistrados];
    
    // Filtrar por nome do motorista
    if (!motoristaSearchTerm) return todosMotoristas;
    
    return todosMotoristas.filter(motorista => 
      motorista.nome?.toLowerCase().includes(motoristaSearchTerm.toLowerCase())
    );
  }, [selectedParceiro, getMotoristasByParceiro, motoristaSearchTerm]);

  const veiculosParceiro = useMemo(() => {
    if (!selectedParceiro) return [];
    const veiculos = getVeiculosByParceiro(selectedParceiro.id);
    
    // Filtrar por placa do veículo
    if (!veiculoSearchTerm) return veiculos;
    
    return veiculos.filter(veiculo => {
      const placaPrincipal = veiculo.tipo === 'Truck' ? veiculo.placa : veiculo.placaCavalo;
      const placaCarreta = veiculo.placaCarreta || '';
      const placaCarreta1 = veiculo.placaCarreta1 || '';
      const placaCarreta2 = veiculo.placaCarreta2 || '';
      const placaDolly = veiculo.placaDolly || '';
      
      const searchLower = veiculoSearchTerm.toLowerCase();
      
      return placaPrincipal?.toLowerCase().includes(searchLower) ||
             placaCarreta?.toLowerCase().includes(searchLower) ||
             placaCarreta1?.toLowerCase().includes(searchLower) ||
             placaCarreta2?.toLowerCase().includes(searchLower) ||
             placaDolly?.toLowerCase().includes(searchLower);
    });
  }, [selectedParceiro, getVeiculosByParceiro, veiculoSearchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalParceiros = parceiros.length;
    const parceirosAtivos = parceiros.filter(p => p.isActive).length;
    const totalMotoristas = motoristas.length;
    const totalVeiculos = veiculos.length;
    const parceirosPF = parceiros.filter(p => p.tipo === 'PF').length;
    const parceirosPJ = parceiros.filter(p => p.tipo === 'PJ').length;
    
    return { 
      totalParceiros, 
      parceirosAtivos, 
      totalMotoristas, 
      totalVeiculos,
      parceirosPF,
      parceirosPJ
    };
  }, [parceiros, motoristas, veiculos]);



  // Handlers para parceiros
  const handleParceiroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se o tipo é válido
    if (parceiroForm.tipo !== 'PF' && parceiroForm.tipo !== 'PJ') {
      alert('Tipo deve ser PF ou PJ');
      return;
    }
    
    const parceiroData = {
      ...parceiroForm,
      tipo: parceiroForm.tipo as 'PF' | 'PJ',
      isActive: true // Sempre ativo por padrão
    };

    if (editingParceiro) {
      updateParceiro(editingParceiro.id, parceiroData);
    } else {
      createParceiro(parceiroData);
    }

    resetParceiroForm();
  };

  const resetParceiroForm = () => {
    setParceiroForm({
      nome: '',
      tipo: 'PF',
      documento: '',
      cnh: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      observacoes: '',
      isMotorista: false
    });
    setEditingParceiro(null);
    setShowParceiroForm(false);
  };

  const handleEditParceiro = (parceiro: any) => {
    setParceiroForm({
      nome: parceiro.nome || '',
      tipo: parceiro.tipo || 'PF',
      documento: parceiro.documento || '',
      cnh: parceiro.cnh || '',
      telefone: parceiro.telefone || '',
      endereco: parceiro.endereco || '',
      cidade: parceiro.cidade || '',
      estado: parceiro.estado || '',
      cep: parceiro.cep || '',
      observacoes: parceiro.observacoes || '',
      isMotorista: parceiro.isMotorista || false
    });
    setEditingParceiro(parceiro);
    setShowParceiroForm(true);
  };

  const handleDeleteParceiro = (id: string) => {
    const parceiro = parceiros.find(p => p.id === id);
    if (parceiro) {
      setDeleteTarget({
        type: 'parceiro',
        id: id,
        name: parceiro.nome || 'Parceiro sem nome'
      });
      setShowDeleteConfirm(true);
    }
  };

  const handleBlockParceiro = (parceiro: any) => {
    const updatedParceiro = {
      ...parceiro,
      status: 'Bloqueado',
      isActive: false
    };
    
    updateParceiro(parceiro.id, updatedParceiro);
    
    if (selectedParceiro?.id === parceiro.id) {
      setSelectedParceiro(null);
    }
  };

  const handleUnblockParceiro = (parceiro: any) => {
    const updatedParceiro = {
      ...parceiro,
      status: 'Ativo',
      isActive: true
    };
    updateParceiro(parceiro.id, updatedParceiro);
    if (selectedParceiro?.id === parceiro.id) {
      setSelectedParceiro(updatedParceiro);
    }
  };

  // Handlers para motoristas
  const handleMotoristaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const motoristaData = {
      ...motoristaForm,
      parceiroId: selectedParceiro.id
    };

    if (editingMotorista) {
      updateMotorista(editingMotorista.id, motoristaData);
    } else {
      createMotorista(motoristaData);
    }

    resetMotoristaForm();
  };

  const resetMotoristaForm = () => {
    setMotoristaForm({
      nome: '',
      cpf: '',
      cnh: '',
      parceiroId: '',
      veiculoVinculado: ''
    });
    setEditingMotorista(null);
    setShowMotoristaForm(false);
  };

  const handleEditMotorista = (motorista: any) => {
    setMotoristaForm({
      nome: motorista.nome || '',
      cpf: motorista.cpf || '',
      cnh: motorista.cnh || '',
      parceiroId: motorista.parceiroId || '',
      veiculoVinculado: motorista.veiculoVinculado || ''
    });
    setEditingMotorista(motorista);
    setShowMotoristaForm(true);
  };

  const handleDeleteMotorista = (id: string) => {
    const motorista = motoristasParceiro.find(m => m.id === id);
    if (motorista) {
      setDeleteTarget({
        type: 'motorista',
        id: id,
        name: motorista.nome
      });
      setShowDeleteConfirm(true);
    }
  };

  // Handlers para veículos
  const handleVeiculoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const veiculoData = {
      ...veiculoForm,
      parceiroId: selectedParceiro.id,
      ano: veiculoForm.ano ? parseInt(veiculoForm.ano) : undefined
    };

    if (editingVeiculo) {
      updateVeiculo(editingVeiculo.id, veiculoData);
    } else {
      createVeiculo(veiculoData);
    }

    resetVeiculoForm();
  };

  const resetVeiculoForm = () => {
    setVeiculoForm({
      tipo: 'Truck',
      placa: '',
      placaCavalo: '',
      fabricante: '',
      modelo: '',
      ano: '',
      chassis: '',
      carroceria: '',
      quantidadeCarretas: 1,
      possuiDolly: false,
      placaCarreta: '',
      placaCarreta1: '',
      placaCarreta2: '',
      placaDolly: '',
      parceiroId: '',
      motoristaVinculado: ''
    });
    setEditingVeiculo(null);
    setShowVeiculoForm(false);
  };

  const handleEditVeiculo = (veiculo: any) => {
    setVeiculoForm({
      tipo: veiculo.tipo || 'Truck',
      placa: veiculo.placa || '',
      placaCavalo: veiculo.placaCavalo || '',
      fabricante: veiculo.fabricante || '',
      modelo: veiculo.modelo || '',
      ano: veiculo.ano || '',
      chassis: veiculo.chassis || '',
      carroceria: veiculo.carroceria || '',
      quantidadeCarretas: veiculo.quantidadeCarretas || 1,
      possuiDolly: veiculo.possuiDolly || false,
      placaCarreta: veiculo.placaCarreta || '',
      placaCarreta1: veiculo.placaCarreta1 || '',
      placaCarreta2: veiculo.placaCarreta2 || '',
      placaDolly: veiculo.placaDolly || '',
      parceiroId: veiculo.parceiroId || '',
      motoristaVinculado: veiculo.motoristaVinculado || ''
    });
    setEditingVeiculo(veiculo);
    setShowVeiculoForm(true);
  };

  const handleDeleteVeiculo = (id: string) => {
    const veiculo = veiculosParceiro.find(v => v.id === id);
    if (veiculo) {
      setDeleteTarget({
        type: 'veiculo',
        id: id,
        name: `${veiculo.fabricante} ${veiculo.modelo} - ${veiculo.tipo === 'Truck' ? veiculo.placa : veiculo.placaCavalo}`
      });
      setShowDeleteConfirm(true);
    }
  };

  // Handler para confirmar exclusão
  const confirmDelete = () => {
    if (deleteTarget) {
      if (deleteTarget.type === 'veiculo') {
        deleteVeiculo(deleteTarget.id);
      } else if (deleteTarget.type === 'motorista') {
        deleteMotorista(deleteTarget.id);
      } else if (deleteTarget.type === 'parceiro') {
        deleteParceiro(deleteTarget.id);
        if (selectedParceiro?.id === deleteTarget.id) {
          setSelectedParceiro(null);
        }
      }
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // Handler para vinculação
  const handleVincular = (type: 'motorista' | 'veiculo', item: any) => {
    setVinculacaoData({ type, item });
    setShowVinculacaoModal(true);
  };

  const handleVinculacaoSubmit = (vinculadoId: string) => {
    // Primeiro, desvincular qualquer vinculação anterior
    handleDesvincular(vinculacaoData.type, vinculacaoData.item);
    
    // Se vinculadoId estiver vazio, apenas desvincular (não vincular novamente)
    if (!vinculadoId) {
      setShowVinculacaoModal(false);
      return;
    }
    
    // Desvincular o item que será vinculado (se já estiver vinculado a outro)
    if (vinculacaoData.type === 'motorista') {
      // Se estamos vinculando um veículo a um motorista, desvincular o veículo de qualquer outro motorista
      const veiculo = veiculosParceiro.find(v => v.id === vinculadoId);
      if (veiculo && veiculo.motoristaVinculado) {
        handleDesvincular('veiculo', veiculo);
      }
    } else {
      // Se estamos vinculando um motorista a um veículo, desvincular o motorista de qualquer outro veículo
      const motorista = motoristasParceiro.find(m => m.id === vinculadoId);
      if (motorista) {
        const veiculoAtual = motorista.id.endsWith('_as_driver') 
          ? veiculosParceiro.find(v => v.motoristaVinculado === motorista.parceiroId)
          : veiculosParceiro.find(v => v.id === motorista.veiculoVinculado);
        if (veiculoAtual) {
          handleDesvincular('motorista', motorista);
        }
      }
    }
    
    // Agora fazer a nova vinculação
    if (vinculacaoData.type === 'motorista') {
      // Verificar se é um parceiro-motorista (ID termina com '_as_driver')
      const isParceiroMotorista = vinculacaoData.item.id.endsWith('_as_driver');
      
      if (isParceiroMotorista) {
        // Para parceiros-motoristas, apenas vinculamos o veículo ao parceiro
        const veiculo = veiculosParceiro.find(v => v.id === vinculadoId);
        if (veiculo) {
          updateVeiculo(vinculadoId, {
            ...veiculo,
            motoristaVinculado: vinculacaoData.item.parceiroId // Usar o ID do parceiro, não o ID virtual
          });
        }
      } else {
        // Para motoristas registrados, usar a lógica original
        updateMotorista(vinculacaoData.item.id, {
          ...vinculacaoData.item,
          veiculoVinculado: vinculadoId
        });
        // Atualizar veículo também
        const veiculo = veiculosParceiro.find(v => v.id === vinculadoId);
        if (veiculo) {
          updateVeiculo(vinculadoId, {
            ...veiculo,
            motoristaVinculado: vinculacaoData.item.id
          });
        }
      }
    } else {
      // Vinculação de veículo
      updateVeiculo(vinculacaoData.item.id, {
        ...vinculacaoData.item,
        motoristaVinculado: vinculadoId
      });
      // Atualizar motorista também
      const motorista = motoristasParceiro.find(m => m.id === vinculadoId);
      if (motorista) {
        // Verificar se é um parceiro-motorista
        const isParceiroMotorista = motorista.id.endsWith('_as_driver');
        
        if (!isParceiroMotorista) {
          updateMotorista(vinculadoId, {
            ...motorista,
            veiculoVinculado: vinculacaoData.item.id
          });
        }
        // Para parceiros-motoristas, a vinculação já está feita no veículo
      }
    }
    setShowVinculacaoModal(false);
  };

  const handleDesvincular = (type: 'motorista' | 'veiculo', item: any) => {
    if (type === 'motorista') {
      // Verificar se é um parceiro-motorista (ID termina com '_as_driver')
      const isParceiroMotorista = item.id.endsWith('_as_driver');
      
      if (isParceiroMotorista) {
        // Para parceiros-motoristas, encontrar o veículo vinculado e remover a vinculação
        const veiculoVinculado = veiculosParceiro.find(v => v.motoristaVinculado === item.parceiroId);
        if (veiculoVinculado) {
          updateVeiculo(veiculoVinculado.id, {
            ...veiculoVinculado,
            motoristaVinculado: ''
          });
        }
      } else {
        // Para motoristas registrados, remover vinculação do motorista
        updateMotorista(item.id, {
          ...item,
          veiculoVinculado: ''
        });
        
        // Também remover vinculação do veículo
        const veiculoVinculado = veiculosParceiro.find(v => v.motoristaVinculado === item.id);
        if (veiculoVinculado) {
          updateVeiculo(veiculoVinculado.id, {
            ...veiculoVinculado,
            motoristaVinculado: ''
          });
        }
      }
    } else {
      // Desvinculação de veículo
      updateVeiculo(item.id, {
        ...item,
        motoristaVinculado: ''
      });
      
      // Também remover vinculação do motorista se não for parceiro-motorista
      const motoristaVinculado = motoristasParceiro.find(m => 
        m.id === item.motoristaVinculado || 
        (m.id.endsWith('_as_driver') && m.parceiroId === item.motoristaVinculado)
      );
      
      if (motoristaVinculado && !motoristaVinculado.id.endsWith('_as_driver')) {
        updateMotorista(motoristaVinculado.id, {
          ...motoristaVinculado,
          veiculoVinculado: ''
        });
      }
    }
  };

  if (!selectedParceiro) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Parceiros</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Gestão de parceiros, motoristas e veículos</p>
          </div>
          <button
            onClick={() => setShowParceiroForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Novo Parceiro</span>
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParceiros}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.parceirosAtivos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pessoa Física</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.parceirosPF}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pessoa Jurídica</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.parceirosPJ}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Motoristas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMotoristas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Veículos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVeiculos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, documento ou email..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os tipos</option>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Bloqueados</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterTipo('');
                  setFilterStatus('');
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Parceiros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Documento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredParceiros.map((parceiro) => (
                  <tr key={parceiro.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{parceiro.nome}</div>
                        {parceiro.isMotorista && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                            Motorista
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        parceiro.tipo === 'PF' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}>
                        {parceiro.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDocument(parceiro.documento || '', parceiro.tipo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{parceiro.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{parceiro.telefone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        parceiro.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {parceiro.isActive ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setSelectedParceiro(parceiro)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Abrir Painel"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditParceiro(parceiro)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {!parceiro.isActive ? (
                          <button
                            onClick={() => handleUnblockParceiro(parceiro)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Desbloquear"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockParceiro(parceiro)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Bloquear"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteParceiro(parceiro.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredParceiros.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhum parceiro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal do Formulário de Parceiro */}
        {showParceiroForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div ref={parceiroModalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingParceiro ? 'Editar Parceiro' : 'Novo Parceiro'}
                  </h3>
                  <button
                    onClick={resetParceiroForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleParceiroSubmit} className="space-y-4">
                  {/* Tipo - Primeiro campo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={parceiroForm.tipo}
                      onChange={(e) => setParceiroForm({ ...parceiroForm, tipo: e.target.value as 'PF' | 'PJ' })}
                      className="input-field"
                      required
                    >
                      <option value="PF">Pessoa Física</option>
                      <option value="PJ">Pessoa Jurídica</option>
                    </select>
                  </div>

                  {/* Switch "É Motorista" apenas para Pessoa Física - logo após o campo Tipo */}
                  {parceiroForm.tipo === 'PF' && (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          É Motorista
                        </label>
                        <button
                          type="button"
                          onClick={() => setParceiroForm({ ...parceiroForm, isMotorista: !parceiroForm.isMotorista })}
                          className={`ml-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                            parceiroForm.isMotorista
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              parceiroForm.isMotorista ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Campos específicos por tipo */}
                  {parceiroForm.tipo === 'PF' ? (
                    <>
                      {/* Pessoa Física: Nome, CPF, CNH (se motorista), Contato, Endereço, Cidade, Estado, CEP, Observações */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.nome}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, nome: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          CPF *
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.documento}
                          onChange={(e) => {
                            const formatted = formatDocument(e.target.value, parceiroForm.tipo as 'PF' | 'PJ');
                            setParceiroForm({ ...parceiroForm, documento: formatted });
                          }}
                          className="input-field"
                          placeholder="000.000.000-00"
                          required
                        />
                      </div>

                      {/* CNH - apenas se for motorista */}
                      {parceiroForm.isMotorista && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            CNH *
                          </label>
                          <input
                            type="text"
                            value={parceiroForm.cnh}
                            onChange={(e) => setParceiroForm({ ...parceiroForm, cnh: e.target.value })}
                            className="input-field"
                            placeholder="00000000000"
                            required={parceiroForm.isMotorista}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contato
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.telefone}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, telefone: e.target.value })}
                          className="input-field"
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Endereço
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.endereco}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, endereco: e.target.value })}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.cidade}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, cidade: e.target.value })}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Estado
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.estado}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, estado: e.target.value })}
                          className="input-field"
                          placeholder="SP"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          CEP
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.cep}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, cep: e.target.value })}
                          className="input-field"
                          placeholder="00000-000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observações
                        </label>
                        <textarea
                          value={parceiroForm.observacoes}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, observacoes: e.target.value })}
                          className="input-field"
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Pessoa Jurídica: CNPJ, Razão Social, Contato, Endereço, Cidade, Estado, CEP, Observações */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          CNPJ *
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.documento}
                          onChange={(e) => {
                            const formatted = formatDocument(e.target.value, parceiroForm.tipo as 'PF' | 'PJ');
                            setParceiroForm({ ...parceiroForm, documento: formatted });
                          }}
                          className="input-field"
                          placeholder="00.000.000/0000-00"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Razão Social *
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.nome}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, nome: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contato
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.telefone}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, telefone: e.target.value })}
                          className="input-field"
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Endereço
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.endereco}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, endereco: e.target.value })}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.cidade}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, cidade: e.target.value })}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Estado
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.estado}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, estado: e.target.value })}
                          className="input-field"
                          placeholder="SP"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          CEP
                        </label>
                        <input
                          type="text"
                          value={parceiroForm.cep}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, cep: e.target.value })}
                          className="input-field"
                          placeholder="00000-000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observações
                        </label>
                        <textarea
                          value={parceiroForm.observacoes}
                          onChange={(e) => setParceiroForm({ ...parceiroForm, observacoes: e.target.value })}
                          className="input-field"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={resetParceiroForm}
                      className="btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                    >
                      {editingParceiro ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Painel do Parceiro Selecionado
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedParceiro(null)}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedParceiro.nome}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedParceiro.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'} • {formatDocument(selectedParceiro.documento, selectedParceiro.tipo)}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleEditParceiro(selectedParceiro)}
          className="btn-secondary"
        >
          Editar Parceiro
        </button>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('veiculos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'veiculos'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            🚗 Veículos ({veiculosParceiro.length})
          </button>
          <button
            onClick={() => setActiveTab('motoristas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'motoristas'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            👤 Motoristas ({motoristasParceiro.length})
          </button>
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'veiculos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Veículos</h2>
            <button
              onClick={() => setShowVeiculoForm(true)}
              className="btn-primary"
            >
              Novo Veículo
            </button>
          </div>

          {/* Campo de busca por placa */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por placa..."
                value={veiculoSearchTerm}
                onChange={(e) => setVeiculoSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            {veiculoSearchTerm && (
              <button
                onClick={() => setVeiculoSearchTerm('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Lista de veículos */}
          <div className="space-y-3">
            {veiculosParceiro.map((veiculo) => {
              const motoristaVinculado = motoristasParceiro.find(m => 
                m.id === veiculo.motoristaVinculado || 
                (m.id.endsWith('_as_driver') && m.parceiroId === veiculo.motoristaVinculado)
              );
              
              return (
                <div key={veiculo.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    {/* Informações principais */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      {/* Veículo */}
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          veiculo.tipo === 'Truck' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {veiculo.tipo}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {veiculo.fabricante} {veiculo.modelo}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {veiculo.ano}
                          </p>
                        </div>
                      </div>

                      {/* Placas */}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {veiculo.tipo === 'Truck' ? veiculo.placa : veiculo.placaCavalo}
                        </p>
                        {veiculo.tipo === 'Conjunto' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {veiculo.quantidadeCarretas === 1 && veiculo.placaCarreta && (
                              <span>Carreta: {veiculo.placaCarreta}</span>
                            )}
                            {veiculo.quantidadeCarretas === 2 && (
                              <div>
                                {veiculo.placaCarreta1 && <div>C1: {veiculo.placaCarreta1}</div>}
                                {veiculo.placaCarreta2 && <div>C2: {veiculo.placaCarreta2}</div>}
                                {veiculo.possuiDolly && veiculo.placaDolly && <div>Dolly: {veiculo.placaDolly}</div>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Motorista */}
                      <div>
                        {motoristaVinculado ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                {motoristaVinculado.nome}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Vinculado</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleVincular('veiculo', veiculo)}
                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                title="Alterar vinculação"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => handleDesvincular('veiculo', veiculo)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Desvincular motorista"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVincular('veiculo', veiculo)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
                          >
                            🔗 Vincular Motorista
                          </button>
                        )}
                      </div>

                      {/* Chassi */}
                      <div className="hidden lg:block">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Chassi: {veiculo.chassis}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditVeiculo(veiculo)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Editar veículo"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteVeiculo(veiculo.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Excluir veículo"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {veiculosParceiro.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Nenhum veículo cadastrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'motoristas' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Motoristas</h2>
            <button
              onClick={() => setShowMotoristaForm(true)}
              className="btn-primary"
            >
              Novo Motorista
            </button>
          </div>

          {/* Campo de busca por nome */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={motoristaSearchTerm}
                onChange={(e) => setMotoristaSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            {motoristaSearchTerm && (
              <button
                onClick={() => setMotoristaSearchTerm('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Lista de motoristas */}
          <div className="space-y-3">
            {motoristasParceiro.map((motorista) => {
              const veiculoVinculado = motorista.id.endsWith('_as_driver') 
                ? veiculosParceiro.find(v => v.motoristaVinculado === motorista.parceiroId)
                : veiculosParceiro.find(v => v.id === motorista.veiculoVinculado);
              
              return (
                <div key={motorista.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    {/* Informações principais */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      {/* Nome */}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {motorista.nome}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Motorista
                        </p>
                      </div>

                      {/* CNH */}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          CNH: {motorista.cnh}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          CPF: {formatDocument(motorista.cpf, 'PF')}
                        </p>
                      </div>

                      {/* Veículo */}
                      <div>
                        {veiculoVinculado ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                {veiculoVinculado.fabricante} {veiculoVinculado.modelo}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {veiculoVinculado.tipo === 'Truck' ? veiculoVinculado.placa : veiculoVinculado.placaCavalo}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleVincular('motorista', motorista)}
                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                title="Alterar vinculação"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => handleDesvincular('motorista', motorista)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Desvincular veículo"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVincular('motorista', motorista)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
                          >
                            🔗 Vincular Veículo
                          </button>
                        )}
                      </div>

                      {/* Status */}
                      <div className="hidden lg:block">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          veiculoVinculado 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {veiculoVinculado ? 'Vinculado' : 'Disponível'}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditMotorista(motorista)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Editar motorista"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMotorista(motorista.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Excluir motorista"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {motoristasParceiro.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Nenhum motorista cadastrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal do Formulário de Motorista */}
      {showMotoristaForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div ref={motoristaModalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingMotorista ? 'Editar Motorista' : 'Novo Motorista'}
                </h3>
                <button
                  onClick={resetMotoristaForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleMotoristaSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={motoristaForm.nome}
                    onChange={(e) => setMotoristaForm({ ...motoristaForm, nome: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={motoristaForm.cpf}
                    onChange={(e) => {
                      const formatted = formatDocument(e.target.value, 'PF');
                      setMotoristaForm({ ...motoristaForm, cpf: formatted });
                    }}
                    className="input-field"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CNH *
                  </label>
                  <input
                    type="text"
                    value={motoristaForm.cnh}
                    onChange={(e) => setMotoristaForm({ ...motoristaForm, cnh: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetMotoristaForm}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingMotorista ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Formulário de Veículo */}
      {showVeiculoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div ref={veiculoModalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
                </h3>
                <button
                  onClick={resetVeiculoForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleVeiculoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Veículo
                    </label>
                    <select
                      value={veiculoForm.tipo}
                      onChange={(e) => setVeiculoForm({ ...veiculoForm, tipo: e.target.value })}
                      className="input-field"
                    >
                      <option value="Truck">Truck</option>
                      <option value="Conjunto">Conjunto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {veiculoForm.tipo === 'Truck' ? 'Placa *' : 'Placa Cavalo *'}
                    </label>
                    <input
                      type="text"
                      value={veiculoForm.tipo === 'Truck' ? veiculoForm.placa : veiculoForm.placaCavalo}
                      onChange={(e) => {
                        const formatted = formatPlaca(e.target.value);
                        if (veiculoForm.tipo === 'Truck') {
                          setVeiculoForm({ ...veiculoForm, placa: formatted });
                        } else {
                          setVeiculoForm({ ...veiculoForm, placaCavalo: formatted });
                        }
                      }}
                      className="input-field"
                      placeholder="ABC-1234"
                      required
                    />
                  </div>
                </div>

                {veiculoForm.tipo === 'Conjunto' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantidade de Carretas
                    </label>
                    <select
                      value={veiculoForm.quantidadeCarretas}
                      onChange={(e) => setVeiculoForm({ ...veiculoForm, quantidadeCarretas: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fabricante
                    </label>
                    <input
                      type="text"
                      value={veiculoForm.fabricante}
                      onChange={(e) => setVeiculoForm({ ...veiculoForm, fabricante: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Modelo
                     </label>
                     <input
                       type="text"
                       value={veiculoForm.modelo}
                       onChange={(e) => setVeiculoForm({ ...veiculoForm, modelo: e.target.value })}
                       className="input-field"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Ano
                     </label>
                     <input
                       type="text"
                       value={veiculoForm.ano}
                       onChange={(e) => setVeiculoForm({ ...veiculoForm, ano: e.target.value })}
                       className="input-field"
                       placeholder="2023"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Chassi
                     </label>
                     <input
                       type="text"
                       value={veiculoForm.chassis}
                      onChange={(e) => setVeiculoForm({ ...veiculoForm, chassis: e.target.value })}
                       className="input-field"
                     />
                   </div>
                 </div>

                 {veiculoForm.tipo === 'Truck' && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Carroceria
                     </label>
                     <input
                       type="text"
                       value={veiculoForm.carroceria}
                       onChange={(e) => setVeiculoForm({ ...veiculoForm, carroceria: e.target.value })}
                       className="input-field"
                     />
                   </div>
                 )}

                 {veiculoForm.tipo === 'Conjunto' && (
                   <>
                     {veiculoForm.quantidadeCarretas === 1 && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Placa Carreta *
                         </label>
                         <input
                           type="text"
                           value={veiculoForm.placaCarreta}
                           onChange={(e) => {
                             const formatted = formatPlaca(e.target.value);
                             setVeiculoForm({ ...veiculoForm, placaCarreta: formatted });
                           }}
                           className="input-field"
                           placeholder="ABC-1234"
                           required
                         />
                       </div>
                     )}

                     {veiculoForm.quantidadeCarretas === 2 && (
                       <>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Possui Dolly?
                           </label>
                           <div className="flex space-x-4">
                             <label className="flex items-center">
                               <input
                                 type="radio"
                                 name="possuiDolly"
                                 checked={veiculoForm.possuiDolly === true}
                                 onChange={() => setVeiculoForm({ ...veiculoForm, possuiDolly: true })}
                                 className="mr-2"
                               />
                               Sim
                             </label>
                             <label className="flex items-center">
                               <input
                                 type="radio"
                                 name="possuiDolly"
                                 checked={veiculoForm.possuiDolly === false}
                                 onChange={() => setVeiculoForm({ ...veiculoForm, possuiDolly: false })}
                                 className="mr-2"
                               />
                               Não
                             </label>
                           </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                               Placa Carreta 1 *
                             </label>
                             <input
                               type="text"
                               value={veiculoForm.placaCarreta1}
                               onChange={(e) => {
                                 const formatted = formatPlaca(e.target.value);
                                 setVeiculoForm({ ...veiculoForm, placaCarreta1: formatted });
                               }}
                               className="input-field"
                               placeholder="ABC-1234"
                               required
                             />
                           </div>

                           <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                               Placa Carreta 2 *
                             </label>
                             <input
                               type="text"
                               value={veiculoForm.placaCarreta2}
                               onChange={(e) => {
                                 const formatted = formatPlaca(e.target.value);
                                 setVeiculoForm({ ...veiculoForm, placaCarreta2: formatted });
                               }}
                               className="input-field"
                               placeholder="ABC-1234"
                               required
                             />
                           </div>
                         </div>

                         {veiculoForm.possuiDolly && (
                           <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                               Placa Dolly *
                             </label>
                             <input
                               type="text"
                               value={veiculoForm.placaDolly}
                               onChange={(e) => {
                                 const formatted = formatPlaca(e.target.value);
                                 setVeiculoForm({ ...veiculoForm, placaDolly: formatted });
                               }}
                               className="input-field"
                               placeholder="ABC-1234"
                               required
                             />
                           </div>
                         )}
                       </>
                     )}
                   </>
                 )}

                 <div className="flex space-x-4 pt-4">
                   <button
                     type="button"
                     onClick={resetVeiculoForm}
                     className="btn-secondary flex-1"
                   >
                     Cancelar
                   </button>
                   <button
                     type="submit"
                     className="btn-primary flex-1"
                   >
                     {editingVeiculo ? 'Atualizar' : 'Criar'}
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Vinculação */}
       {showVinculacaoModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div ref={vinculacaoModalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
             <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                   Vincular {vinculacaoData.type === 'motorista' ? 'Veículo' : 'Motorista'}
                 </h3>
                 <button
                   onClick={() => setShowVinculacaoModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               <div className="space-y-4">
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                   Selecione {vinculacaoData.type === 'motorista' ? 'um veículo' : 'um motorista'} para vincular a{' '}
                   <strong>{vinculacaoData.item?.nome}</strong>:
                 </p>

                 <div className="space-y-2 max-h-60 overflow-y-auto">
                   {vinculacaoData.type === 'motorista' ? (
                     <>
                       {veiculosParceiro
                         .filter(v => !v.motoristaVinculado || v.motoristaVinculado === vinculacaoData.item?.id)
                         .map((veiculo) => (
                           <button
                             key={veiculo.id}
                             onClick={() => handleVinculacaoSubmit(veiculo.id)}
                             className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                           >
                             <div className="font-medium">{veiculo.fabricante} {veiculo.modelo}</div>
                             <div className="text-sm text-gray-500">
                               {veiculo.tipo === 'Truck' ? veiculo.placa : veiculo.placaCavalo} • {veiculo.tipo}
                             </div>
                           </button>
                         ))}
                       {veiculosParceiro.filter(v => !v.motoristaVinculado).length === 0 && (
                         <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                           Nenhum veículo dispon��vel para vinculação
                         </p>
                       )}
                     </>
                   ) : (
                     <>
                       {motoristasParceiro
                         .filter(m => !m.veiculoVinculado || m.veiculoVinculado === vinculacaoData.item?.id)
                         .map((motorista) => (
                           <button
                             key={motorista.id}
                             onClick={() => handleVinculacaoSubmit(motorista.id)}
                             className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                           >
                             <div className="font-medium">{motorista.nome}</div>
                             <div className="text-sm text-gray-500">
                               CPF: {formatDocument(motorista.cpf, 'PF')} • CNH: {motorista.cnh}
                             </div>
                           </button>
                         ))}
                       {motoristasParceiro.filter(m => !m.veiculoVinculado).length === 0 && (
                         <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                           Nenhum motorista disponível para vincula��ão
                         </p>
                       )}
                     </>
                   )}
                 </div>

                 <div className="flex space-x-4 pt-4">
                   <button
                     onClick={() => handleVinculacaoSubmit('')}
                     className="btn-secondary flex-1"
                   >
                     Desvincular
                   </button>
                   <button
                     onClick={() => setShowVinculacaoModal(false)}
                     className="btn-primary flex-1"
                   >
                     Cancelar
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar Exclusão
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir {
                deleteTarget.type === 'veiculo' ? 'o veículo' : 
                deleteTarget.type === 'motorista' ? 'o motorista' : 
                'o parceiro'
              }{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>?
              {deleteTarget.type === 'veiculo' && (
                <span className="block mt-2 text-sm text-red-600 dark:text-red-400">
                  Esta ação também removerá qualquer vinculação com motoristas.
                </span>
              )}
              {deleteTarget.type === 'motorista' && (
                <span className="block mt-2 text-sm text-red-600 dark:text-red-400">
                  Esta ação também removerá qualquer vinculação com veículos.
                </span>
              )}
              {deleteTarget.type === 'parceiro' && (
                <span className="block mt-2 text-sm text-red-600 dark:text-red-400">
                  Esta ação removerá o parceiro e todos os seus motoristas e veículos associados.
                </span>
              )}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

     </div>
   );
 }
