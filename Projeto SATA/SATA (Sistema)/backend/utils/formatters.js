const getCamaNome = (camaNumero) => {
    if (camaNumero === null || camaNumero === undefined || camaNumero === '') return null;
    const valor = String(camaNumero).trim();
    if (/^cama\s+[a-z]$/i.test(valor)) return valor.replace(/\s+/g, ' ').replace(/^cama\s+/i, 'Cama ');
    if (/^[a-z]$/i.test(valor)) return `Cama ${valor.toUpperCase()}`;
    const num = parseInt(valor, 10);
    if (!Number.isNaN(num) && num > 0) return `Cama ${String.fromCharCode(64 + num)}`;
    return `Cama ${valor}`;
};

module.exports = { getCamaNome };
