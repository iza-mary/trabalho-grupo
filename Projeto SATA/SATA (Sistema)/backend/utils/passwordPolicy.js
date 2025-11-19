function checkPassword(password) {
  if (typeof password !== 'string') return 'Senha inválida';
  const pw = password.trim();
  if (pw.length < 8) return 'Senha deve ter pelo menos 8 caracteres';

  const lower = pw.toLowerCase();
  const commonSet = new Set([
    '123456', '12345678', '123456789', '1234567890',
    'password', 'qwerty', 'abc123', '111111', '123123',
    'senha', 'admin', 'letmein'
  ]);
  if (commonSet.has(lower)) return 'Senha muito comum, escolha outra';

  // Repetição do mesmo caractere
  if (/^(.)\1{7,}$/.test(pw)) return 'Senha muito simples, evite caracteres repetidos';

  // Sequências conhecidas simples
  const sequences = [
    '0123456789', '1234567890', 'abcdefghijklmnopqrstuvwxyz',
  ];
  for (const seq of sequences) {
    if (lower.includes(seq.substring(0, 8))) {
      return 'Senha sequencial muito simples, escolha outra';
    }
  }

  // Não exigir maiúsculas ou símbolos: senhas somente com minúsculas e números são válidas
  return null; // null indica sem erro
}

module.exports = { checkPassword };
/*
  Política de Senha
  - Valida regras mínimas de senha e retorna mensagens de erro amigáveis.
*/