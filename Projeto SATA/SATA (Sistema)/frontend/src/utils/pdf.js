export async function downloadPdf(element, filename = 'documento.pdf') {
  if (!element) return
  const html2pdf = (await import('html2pdf.js')).default
  const opt = {
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }
  await html2pdf().set(opt).from(element).save()
}