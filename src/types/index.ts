export interface User {
  id: string
  username: string
  password: string
  email?: string
  name?: string
  role: 'admin' | 'master' | 'comum'
  isActive?: boolean
  createdBy?: string
  permissions?: {
    inicio: 'none' | 'view' | 'edit'
    financeiro: 'none' | 'view' | 'edit'
    cargas: 'none' | 'view' | 'edit'
    parceiros: 'none' | 'view' | 'edit'
    usuarios: 'none' | 'view' | 'edit'
  }
  createdAt: Date
  updatedAt: Date
}

export interface Parceiro {
  id: string
  tipo: 'PF' | 'PJ'
  nome?: string
  cpf?: string
  cnh?: string
  cnpj?: string
  razaoSocial?: string
  chavePix: string
  isMotorista?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Motorista {
  id: string
  parceiroId: string
  nome: string
  cpf: string
  cnh: string
  veiculoVinculado?: string
  createdAt: Date
  updatedAt: Date
}

export interface Veiculo {
  id: string
  parceiroId: string
  tipo: 'truck' | 'conjunto'
  placa?: string
  placaCavalo?: string
  placaCarreta?: string
  placaCarreta2?: string
  placaDolly?: string
  quantidadeCarretas?: 1 | 2
  possuiDolly?: boolean
  fabricante: string
  modelo: string
  ano: number
  chassi: string
  carroceria?: string
  motoristaVinculado?: string
  createdAt: Date
  updatedAt: Date
}

export interface MovimentacaoFinanceira {
  id: string
  descricao: string
  valor: number
  dataVencimento: Date
  status: 'a_vencer' | 'vencido' | 'pago'
  tipo: 'receita' | 'despesa'
  frequencia: 'pontual' | 'recorrente'
  parceiroId?: string
  observacao?: string
  anexo?: string
  recorrencia?: {
    tipo: 'indeterminado' | 'quantidade'
    meses?: number
    proximaData?: Date
  }
  cargaId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Carga {
  id: string
  cliente: string
  crt: string
  dataCarregamento: Date
  previsaoEntrega: Date
  origem: string
  destino: string
  equipamento: string
  peso: number
  valor: number
  tipoPagamento: 'adiantamento_70' | 'adiantamento_80' | 'integral'
  motoristaId?: string
  parceiroId?: string
  placaCavalo?: string
  placaCarreta?: string
  status: 'ativa' | 'finalizada'
  createdAt: Date
  updatedAt: Date
}

export interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

export interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

export interface DatabaseContextType {
  users: User[]
  parceiros: Parceiro[]
  motoristas: Motorista[]
  veiculos: Veiculo[]
  movimentacoes: MovimentacaoFinanceira[]
  cargas: Carga[]
  
  // User operations
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => User
  updateUser: (id: string, user: Partial<User>) => User | null
  deleteUser: (id: string) => boolean
  getUserById: (id: string) => User | null
  
  // Parceiro operations
  createParceiro: (parceiro: Omit<Parceiro, 'id' | 'createdAt' | 'updatedAt'>) => Parceiro
  updateParceiro: (id: string, parceiro: Partial<Parceiro>) => Parceiro | null
  deleteParceiro: (id: string) => boolean
  getParceiroById: (id: string) => Parceiro | null
  
  // Motorista operations
  createMotorista: (motorista: Omit<Motorista, 'id' | 'createdAt' | 'updatedAt'>) => Motorista
  updateMotorista: (id: string, motorista: Partial<Motorista>) => Motorista | null
  deleteMotorista: (id: string) => boolean
  getMotoristasByParceiro: (parceiroId: string) => Motorista[]
  
  // Veiculo operations
  createVeiculo: (veiculo: Omit<Veiculo, 'id' | 'createdAt' | 'updatedAt'>) => Veiculo
  updateVeiculo: (id: string, veiculo: Partial<Veiculo>) => Veiculo | null
  deleteVeiculo: (id: string) => boolean
  getVeiculosByParceiro: (parceiroId: string) => Veiculo[]
  
  // Movimentacao operations
  createMovimentacao: (movimentacao: Omit<MovimentacaoFinanceira, 'id' | 'createdAt' | 'updatedAt'>) => MovimentacaoFinanceira
  updateMovimentacao: (id: string, movimentacao: Partial<MovimentacaoFinanceira>) => MovimentacaoFinanceira | null
  deleteMovimentacao: (id: string) => boolean
  
  // Carga operations
  createCarga: (carga: Omit<Carga, 'id' | 'createdAt' | 'updatedAt'>) => Carga
  updateCarga: (id: string, carga: Partial<Carga>) => Carga | null
  deleteCarga: (id: string) => boolean
}