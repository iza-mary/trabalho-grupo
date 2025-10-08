import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

// SearchSelect (adaptado para itens locais)
// Props:
// - label: texto do label
// - items: [{ value, label, ...extra }] lista de opções
// - onSelect: callback(item | null)
// - initialValue: item inicial selecionado (mesmo shape de items)
// - placeholder: placeholder do input
// - required: campo obrigatório
// - className: classes extras no container
// - disabled: desabilita input
// - valueField/displayField: nomes dos campos (default: value/label)
// - filterFn: função custom de filtro (opcional)
export default function SearchSelect({
  label,
  items = [],
  endpoint, // opcional: ativa busca remota quando definido (ex: 'quartos')
  onSelect,
  initialValue,
  placeholder,
  required = false,
  className = '',
  disabled = false,
  valueField = 'value',
  displayField = 'label',
  filterFn,
  preserveSelectionOnItemsChange = true,
  formatDisplay, // opcional: função para definir o texto do item
  queryParams = {}, // opcional: params extras para requisições remotas
  minChars = 1, // mínimo de caracteres para iniciar a busca
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const initializedRef = useRef(false);

  // Sincroniza valor inicial evitando loops por atualizações idênticas
  useEffect(() => {
    // Sincroniza apenas quando o ID inicial muda (evita dependência do objeto)
    const hasInitial = !!(initialValue && initialValue[displayField]);
    const nextId = hasInitial ? initialValue[valueField] : undefined;
    const currentId = selectedItem ? selectedItem[valueField] : undefined;

    if (hasInitial && (!initializedRef.current || currentId !== nextId)) {
      const nextText = formatDisplay
        ? String(formatDisplay(initialValue) || '')
        : String(initialValue[displayField] || '');
      setSelectedItem(initialValue);
      setSearchTerm(nextText);
      initializedRef.current = true;
    } else if (!hasInitial && initializedRef.current) {
      // Limpa somente após ter inicializado uma vez
      setSelectedItem(null);
      setSearchTerm('');
    }
  }, [initialValue, selectedItem, displayField, valueField, formatDisplay]);

  // Atualiza resultados: busca remota se endpoint definido; caso contrário, filtra itens locais
  useEffect(() => {
    const term = (searchTerm || '').toLowerCase();

    // Modo remoto
    if (endpoint) {
      if ((searchTerm || '').length < minChars) {
        setResults([]);
        return;
      }

      const fetchRemote = async () => {
        try {
          const params = { search: searchTerm, ...queryParams };
          const { data } = await api.get(`/${endpoint}`, { params });
          const list = data?.data || data || [];
          setResults(Array.isArray(list) ? list.slice(0, 50) : []);
        } catch (error) {
          console.error('Erro ao buscar dados remotos:', error);
          setResults([]);
        }
      };

      const tId = setTimeout(fetchRemote, 300);
      return () => clearTimeout(tId);
    }

    // Modo local
    let filtered = items;
    if (typeof filterFn === 'function') {
      filtered = items.filter((item) => filterFn(item, term));
    } else if (term) {
      filtered = items.filter((item) =>
        String(item[displayField] || '')
          .toLowerCase()
          .includes(term)
      );
    }
    setResults(filtered.slice(0, 50));
  }, [items, searchTerm, displayField, filterFn, endpoint, minChars]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função de limpar seleção (declarada antes de efeitos que a utilizam)
  const handleClear = useCallback(() => {
    setSelectedItem(null);
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    onSelect && onSelect(null);
    inputRef.current && inputRef.current.focus();
  }, [onSelect]);

  // Se o item selecionado sair da lista (ficar indisponível), limpar seleção
  useEffect(() => {
    if (!selectedItem || preserveSelectionOnItemsChange) return;
    const stillExists = items.some(
      (it) => it[valueField] === selectedItem[valueField]
    );
    if (!stillExists) {
      handleClear();
    }
  }, [items, valueField, selectedItem, preserveSelectionOnItemsChange, handleClear]);

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    const text = formatDisplay
      ? String(formatDisplay(item) || '')
      : String(item[displayField] || '');
    setSearchTerm(text);
    setIsOpen(false);
    setResults([]);
    onSelect && onSelect(item);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value === '') {
      handleClear();
    } else {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className={`search-select-container ${className}`} ref={containerRef}>
      {label && (
        <label className="form-label fw-semibold">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}

      <div className="position-relative">
        <input
          ref={inputRef}
          type="text"
          className={`form-control ${disabled ? 'bg-light' : ''}`}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={
            placeholder || `Buscar ${(label || '').toLowerCase()}...`
          }
          disabled={disabled}
          required={required}
        />

        {selectedItem && !disabled && (
          <button
            type="button"
            className="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-2 border-0 bg-transparent"
            onClick={handleClear}
          >
            <i className="fas fa-times text-muted"></i>
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="border rounded mt-1 bg-white shadow-sm"
          style={{
            position: 'absolute',
            width: '100%',
            zIndex: 1000,
            maxHeight: '250px',
            overflowY: 'auto',
          }}
        >
        {results.length === 0 ? (
          <div className="p-3 text-center text-muted">
              {searchTerm
                ? 'Nenhum resultado encontrado'
                : `Digite pelo menos ${minChars} caractere(s)`}
          </div>
        ) : (
          <div className="py-2">
              {results.map((item) => (
                <button
                  key={item[valueField]}
                  type="button"
                  className="btn btn-text w-100 text-start px-3 py-2 border-0 hover-bg-light"
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="fw-semibold">
                    {formatDisplay
                      ? String(formatDisplay(item) || '')
                      : String(item[displayField] || '')}
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
      )}

      <style jsx>{`
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .btn-text { background: none; border: none; cursor: pointer; transition: background-color 0.2s; }
        .btn-text:hover { background-color: #f8f9fa; }
      `}</style>
    </div>
  );
}