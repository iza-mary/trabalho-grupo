// Utilitários para sanitização de impressão
// - Remove quebras de página manuais
// - Preserva elementos estruturais (header/footer/main/table)
// - Fornece opção de normalização de espaçamento entre parágrafos

function isStructural(el) {
  if (!el) return false;
  const role = (el.getAttribute('role') || '').toLowerCase();
  const tag = el.tagName.toLowerCase();
  const structuralTags = new Set(['header', 'footer', 'main', 'nav', 'table', 'thead', 'tfoot']);
  const structuralRoles = new Set(['banner', 'contentinfo', 'main', 'navigation']);
  return structuralTags.has(tag) || structuralRoles.has(role);
}

export function removeManualPageBreaks(root) {
  if (!root) return;
  // Remover classes page-break apenas em nós não-estruturais
  const candidates = root.querySelectorAll('.page-break');
  candidates.forEach((el) => {
    if (isStructural(el)) return;
    // Em vez de remover o nó, apenas neutralizar a quebra
    el.classList.remove('page-break');
    el.style.breakAfter = 'auto';
    el.style.pageBreakAfter = 'auto';
  });

  // Neutralizar estilos inline de quebra sem tocar em elementos estruturais
  const all = root.querySelectorAll('*');
  all.forEach((el) => {
    if (isStructural(el)) return;
    const s = el.style;
    if (!s) return;
    // page-break-* e break-*
    if (s.pageBreakBefore) s.pageBreakBefore = 'auto';
    if (s.pageBreakAfter) s.pageBreakAfter = 'auto';
    if (s.breakBefore) s.breakBefore = 'auto';
    if (s.breakAfter) s.breakAfter = 'auto';
    if (s.breakInside) s.breakInside = 'auto';
  });
}

export function applySpacingNormalization(root) {
  if (!root) return;
  root.classList.add('print-spacing-normalized');
}

export function removeSpacingNormalization(root) {
  if (!root) return;
  root.classList.remove('print-spacing-normalized');
}

export default {
  removeManualPageBreaks,
  applySpacingNormalization,
  removeSpacingNormalization,
};
/*
  PrintSanitizer
  - Funções para sanitizar conteúdo antes de gerar impressão/relatórios.
*/