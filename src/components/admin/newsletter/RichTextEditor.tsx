
import React, { useEffect, useRef, useState } from 'react';
import {
    Bold, Italic, Underline, List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight, Link, Image,
    Undo, Redo, Heading1, Heading2, Quote
} from 'lucide-react';

interface RichTextEditorProps {
    initialValue: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    initialValue,
    onChange,
    placeholder = 'Escribe aquí...',
    className = ''
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Initialize content only once to avoid cursor jumping
    useEffect(() => {
        if (editorRef.current && initialValue && editorRef.current.innerHTML !== initialValue) {
            // Only set if empty to prevent overwriting edits if parent re-renders
            if (editorRef.current.innerHTML === '' || editorRef.current.innerHTML === '<br>') {
                editorRef.current.innerHTML = initialValue;
            }
        }
    }, []);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
            handleInput();
        }
    };

    const ToolbarButton = ({
        icon: Icon,
        command,
        value = undefined,
        title
    }: {
        icon: any,
        command: string,
        value?: string,
        title: string
    }) => (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                execCommand(command, value);
            }}
            className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 rounded transition-colors"
            title={title}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className={`flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white ${className} ${isFocused ? 'ring-2 ring-red-500 ring-opacity-50 border-red-500' : ''}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
                    <ToolbarButton icon={Undo} command="undo" title="Deshacer" />
                    <ToolbarButton icon={Redo} command="redo" title="Rehacer" />
                </div>

                <div className="flex items-center gap-1 px-2 border-r border-gray-300">
                    <ToolbarButton icon={Bold} command="bold" title="Negrita" />
                    <ToolbarButton icon={Italic} command="italic" title="Cursiva" />
                    <ToolbarButton icon={Underline} command="underline" title="Subrayado" />
                </div>

                <div className="flex items-center gap-1 px-2 border-r border-gray-300">
                    <ToolbarButton icon={Heading1} command="formatBlock" value="<H1>" title="Título 1" />
                    <ToolbarButton icon={Heading2} command="formatBlock" value="<H2>" title="Título 2" />
                    <ToolbarButton icon={Quote} command="formatBlock" value="<BLOCKQUOTE>" title="Cita" />
                </div>

                <div className="flex items-center gap-1 px-2 border-r border-gray-300">
                    <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Alinear Izquierda" />
                    <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Centrar" />
                    <ToolbarButton icon={AlignRight} command="justifyRight" title="Alinear Derecha" />
                </div>

                <div className="flex items-center gap-1 px-2">
                    <ToolbarButton icon={List} command="insertUnorderedList" title="Lista con viñetas" />
                    <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Lista numerada" />
                </div>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 p-4 outline-none prose max-w-none overflow-y-auto"
                style={{
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: '1.6',
                    minHeight: '400px',
                    maxHeight: '600px' // Limit height to force scroll
                }}
            />
            {(!editorRef.current?.innerText && !initialValue) && (
                <div className="absolute top-[60px] left-4 text-gray-400 pointer-events-none">
                    {placeholder}
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
