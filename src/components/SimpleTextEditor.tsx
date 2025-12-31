import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  Link as LinkIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette
} from 'lucide-react';

interface SimpleTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
}

const COLORS = [
  { name: 'Negro', value: '#000000' },
  { name: 'Rojo UGT', value: '#DC2626' },
  { name: 'Rojo Oscuro', value: '#991B1B' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Naranja', value: '#F59E0B' },
  { name: 'Gris', value: '#6B7280' },
];

export default function SimpleTextEditor({
  value,
  onChange,
  placeholder = 'Escribe el contenido del comunicado...',
  disabled = false,
  minHeight = 400
}: SimpleTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [charCount, setCharCount] = useState(0);

  // Inicializar contenido del editor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      updateCharCount();
    }
  }, [value]);

  // Actualizar contador de caracteres
  const updateCharCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      setCharCount(text.length);
    }
  };

  // Manejar cambios en el editor
  const handleInput = () => {
    if (editorRef.current) {
      let content = editorRef.current.innerHTML;
      
      // Limpiar y normalizar HTML
      content = content.replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>');
      content = content.replace(/<br><br>/g, '<br>');
      
      onChange(content);
      updateCharCount();
    }
  };

  // Ejecutar comando de formato
  const executeCommand = (command: string, value: string | null = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value || undefined);
    
    // Usar setTimeout para asegurar que el DOM se actualice antes de capturar HTML
    setTimeout(() => {
      handleInput(); // Actualizar contenido después del comando
    }, 0);
  };

  // Aplicar negrita
  const applyBold = () => {
    executeCommand('bold');
  };

  // Aplicar cursiva
  const applyItalic = () => {
    executeCommand('italic');
  };

  // Aplicar color
  const applyColor = (color: string) => {
    executeCommand('foreColor', color);
    setShowColorPicker(false);
  };

  // Aplicar lista con viñetas
  const applyBulletList = () => {
    executeCommand('insertUnorderedList');
  };

  // Aplicar alineación
  const applyAlignment = (align: 'left' | 'center' | 'right') => {
    const command = align === 'left' ? 'justifyLeft' : 
                    align === 'center' ? 'justifyCenter' : 
                    'justifyRight';
    executeCommand(command);
  };

  // Insertar enlace
  const insertLink = () => {
    if (linkUrl) {
      executeCommand('createLink', linkUrl);
      setShowLinkDialog(false);
      setLinkUrl('');
    }
  };

  // Manejar atajos de teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+B para negrita
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      applyBold();
    }
    // Ctrl+I para cursiva
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      applyItalic();
    }
  };

  return (
    <div className="simple-text-editor border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-3 flex flex-wrap gap-2">
        {/* Negrita */}
        <button
          type="button"
          onClick={applyBold}
          disabled={disabled}
          className="px-3 py-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white"
          title="Negrita (Ctrl+B)"
        >
          <Bold className="h-5 w-5" />
        </button>

        {/* Cursiva */}
        <button
          type="button"
          onClick={applyItalic}
          disabled={disabled}
          className="px-3 py-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white"
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="h-5 w-5" />
        </button>

        <div className="w-px h-10 bg-gray-400"></div>

        {/* Selector de color - MEJORADO */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={disabled}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white flex items-center gap-2"
            title="Color de texto"
          >
            <Palette className="h-5 w-5" />
            <span className="text-sm font-medium">Color</span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-xl p-3 z-20">
              <div className="mb-2 text-xs font-semibold text-gray-700">Selecciona un color:</div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => applyColor(color.value)}
                    className="w-10 h-10 rounded-md border-2 border-gray-400 hover:border-red-600 hover:scale-110 transition-all"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="w-full px-2 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded font-medium"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-10 bg-gray-400"></div>

        {/* Lista con viñetas - MEJORADO */}
        <button
          type="button"
          onClick={applyBulletList}
          disabled={disabled}
          className="px-3 py-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white flex items-center gap-2"
          title="Lista con viñetas"
        >
          <List className="h-5 w-5" />
          <span className="text-sm font-medium">Lista</span>
        </button>

        <div className="w-px h-10 bg-gray-400"></div>

        {/* Alineación */}
        <button
          type="button"
          onClick={() => applyAlignment('left')}
          disabled={disabled}
          className="px-3 py-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white"
          title="Alinear a la izquierda"
        >
          <AlignLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => applyAlignment('center')}
          disabled={disabled}
          className="px-3 py-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white"
          title="Alinear al centro"
        >
          <AlignCenter className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => applyAlignment('right')}
          disabled={disabled}
          className="px-3 py-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white"
          title="Alinear a la derecha"
        >
          <AlignRight className="h-5 w-5" />
        </button>

        <div className="w-px h-10 bg-gray-400"></div>

        {/* Enlace */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLinkDialog(!showLinkDialog)}
            disabled={disabled}
            className="px-3 py-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white flex items-center gap-2"
            title="Insertar enlace"
          >
            <LinkIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Enlace</span>
          </button>
          {showLinkDialog && (
            <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-xl p-4 z-20 w-80">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL del enlace:
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://ejemplo.com"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm mb-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={insertLink}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700"
                >
                  Insertar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkUrl('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="p-4 outline-none overflow-y-auto focus:bg-blue-50/30 transition-colors"
        style={{ 
          minHeight: `${minHeight}px`,
          maxHeight: '600px'
        }}
        data-placeholder={placeholder}
      />

      {/* Footer con contador */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2.5 text-sm text-gray-600 flex justify-between items-center">
        <div className="text-xs">
          <span className="font-semibold">Consejos:</span> Usa <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Ctrl+B</kbd> para negrita, <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Ctrl+I</kbd> para cursiva
        </div>
        <div className="text-sm font-semibold text-red-600">
          {charCount} caracteres
        </div>
      </div>

      <style>{`
        .simple-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        
        .simple-text-editor [contenteditable] {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: #374151;
        }
        
        .simple-text-editor [contenteditable] strong,
        .simple-text-editor [contenteditable] b {
          font-weight: 700 !important;
        }
        
        .simple-text-editor [contenteditable] em,
        .simple-text-editor [contenteditable] i {
          font-style: italic !important;
        }
        
        .simple-text-editor [contenteditable] ul {
          list-style-type: disc !important;
          padding-left: 2rem !important;
          margin: 1rem 0 !important;
        }
        
        .simple-text-editor [contenteditable] li {
          margin: 0.5rem 0 !important;
          display: list-item !important;
        }
        
        .simple-text-editor [contenteditable] a {
          color: #DC2626 !important;
          text-decoration: underline !important;
        }
        
        .simple-text-editor [contenteditable] a:hover {
          color: #991B1B !important;
        }
        
        .simple-text-editor [contenteditable] [style*="text-align: center"] {
          text-align: center !important;
        }
        
        .simple-text-editor [contenteditable] [style*="text-align: right"] {
          text-align: right !important;
        }
        
        .simple-text-editor [contenteditable] [style*="text-align: left"] {
          text-align: left !important;
        }
        
        .simple-text-editor [contenteditable]:focus {
          outline: none;
        }

        /* Asegurar que los estilos se preserven en el HTML generado */
        .simple-text-editor [contenteditable] * {
          color: inherit;
        }
      `}</style>
    </div>
  );
}
