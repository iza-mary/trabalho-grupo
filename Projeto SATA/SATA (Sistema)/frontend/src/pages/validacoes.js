export const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

export const validarCartaoSUS = (cartao) => {
  cartao = cartao.replace(/[^\d]+/g, '');
  if (cartao.length !== 15) return false;
  return /^\d{15}$/.test(cartao);
};

export const formatarTelefone = (telefone) => {
  return telefone
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2');
};

export const formatarCPF = (cpf) => {
  return cpf
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatarCEP = (cep) => {
  return cep
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

// --- RG ---
export const normalizarRG = (rg) => String(rg || '').replace(/\D/g, '');

// Formatação progressiva padrão: 2.3.3 com hífen no último dígito quando houver
export const formatarRG = (valor) => {
  const digitos = normalizarRG(valor);
  let v = digitos;
  v = v.replace(/(\d{2})(\d)/, '$1.$2');
  v = v.replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  v = v.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  return v;
};

// Validação: somente dígitos, tamanho por estado (quando disponível)
// Padrões comuns: DF=7, SP=9, RS=10; demais aceitam 7–10 dígitos
const rgTamanhoPorEstado = {
  'Distrito Federal': 7,
  'São Paulo': 9,
  'Rio Grande do Sul': 10,
};

export const validarRG = (rg, estado) => {
  const digitos = normalizarRG(rg);
  if (!digitos) return false;
  if (!/^\d+$/.test(digitos)) return false;

  // Determina tamanho esperado
  const esperado = estado ? rgTamanhoPorEstado[estado] : undefined;
  if (esperado) {
    if (digitos.length !== esperado) return false;
  } else {
    if (digitos.length < 7 || digitos.length > 10) return false;
  }

  // evita sequências com todos dígitos iguais
  const repeticoesMin = Math.max(7, Math.min(digitos.length, 10));
  const regexTodosIguais = new RegExp(`^(\\d)\\1{${repeticoesMin - 1},}$`);
  if (regexTodosIguais.test(digitos)) return false;

  return true;
};

// --- CPF/CNPJ helpers ---
export const normalizarCPF = (cpf) => String(cpf || '').replace(/\D/g, '');

export const formatarCNPJ = (cnpj) => {
  return String(cnpj || '')
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const normalizarCNPJ = (cnpj) => String(cnpj || '').replace(/\D/g, '');

export const validarCNPJ = (cnpj) => {
  cnpj = normalizarCNPJ(cnpj);
  if (!cnpj || cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;
  tamanho += 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1), 10);
};

export const estadosBrasileiros = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
  'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
  'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
  'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
  'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima',
  'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

export const validarFormulario = (formData) => {
  const erros = {};
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (!formData.nome || !formData.nome.trim || !formData.nome.trim()) {
    erros.nome = 'Nome completo é obrigatório';
  } else if (formData.nome.trim().length < 5) {
    erros.nome = 'Nome deve ter pelo menos 5 caracteres';
  }
  
  if (!formData.dataNascimento) {
    erros.dataNascimento = 'Data de nascimento é obrigatória';
  } else {
    const dataNasc = new Date(formData.dataNascimento);
    if (dataNasc > hoje) {
      erros.dataNascimento = 'Data de nascimento não pode ser no futuro';
    }
  }
  
  if (!formData.genero) {
    erros.genero = 'Gênero é obrigatório';
  }
  
  if (!formData.rg || !formData.rg.trim || !formData.rg.trim()) {
    erros.rg = 'RG é obrigatório';
  } else if (!validarRG(formData.rg, formData.estado)) {
    erros.rg = 'RG inválido';
  }
  
  if (!formData.cpf || !formData.cpf.trim || !formData.cpf.trim()) {
    erros.cpf = 'CPF é obrigatório';
  } else if (!validarCPF(formData.cpf)) {
    erros.cpf = 'CPF inválido';
  }
  
  if (!formData.cartaoSus || !formData.cartaoSus.trim || !formData.cartaoSus.trim()) {
    erros.cartaoSus = 'Cartão SUS é obrigatório';
  } else if (!validarCartaoSUS(formData.cartaoSus)) {
    erros.cartaoSus = 'Cartão SUS inválido';
  }
  
  if (!formData.telefone || !formData.telefone.trim || !formData.telefone.trim()) {
    erros.telefone = 'Telefone é obrigatório';
  } else if (formData.telefone.replace(/\D/g, '').length < 10) {
    erros.telefone = 'Telefone inválido';
  }
  
  if (!formData.rua || !formData.rua.trim || !formData.rua.trim()) {
    erros.rua = 'Rua é obrigatória';
  }
  
  if (!formData.numero || !formData.numero.trim || !formData.numero.trim()) {
    erros.numero = 'Número é obrigatório';
  }
  
  if (!formData.cidade || !formData.cidade.trim || !formData.cidade.trim()) {
    erros.cidade = 'Cidade é obrigatória';
  }
  
  if (!formData.estado) {
    erros.estado = 'Estado é obrigatório';
  } else if (!estadosBrasileiros.includes(formData.estado)) {
    erros.estado = 'Estado inválido';
  }
  
  if (!formData.cep || !formData.cep.trim || !formData.cep.trim()) {
    erros.cep = 'CEP é obrigatório';
  } else if (formData.cep.replace(/\D/g, '').length !== 8) {
    erros.cep = 'CEP inválido';
  }
  
  return erros;
};

export const validarFormularioInternacao = (formData) => {
  const erros = {};
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (!formData.dataEntrada) {
    erros.dataEntrada = 'Data de entrada é obrigatória';
  } else {
    const dataEntrada = new Date(formData.dataEntrada);
    if (dataEntrada > hoje) {
      erros.dataEntrada = 'Data de entrada não pode ser no futuro';
    }
  }
  
  if (!formData.quarto) {
    erros.quarto = 'Quarto é obrigatório';
  } else if (!/^[A-Za-z0-9-]+$/.test(formData.quarto)) {
    erros.quarto = 'Quarto deve conter apenas letras, números e hífen';
  }
  
  if (!formData.cama) {
    erros.cama = 'Cama é obrigatória';
  } else if (!/^[A-Za-z0-9-]+$/.test(formData.cama)) {
    erros.cama = 'Cama deve conter apenas letras, números e hífen';
  }
  
  return erros;
};