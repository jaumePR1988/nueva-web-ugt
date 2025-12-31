import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface CitasExportButtonsProps {
    setShowExportModal: (show: boolean) => void;
    exportToPDF: () => void;
    exportCompleteReport: () => void;
    exporting: boolean;
}

export const CitasExportButtons: React.FC<CitasExportButtonsProps> = ({
    setShowExportModal,
    exportToPDF,
    exportCompleteReport,
    exporting
}) => {
    return (
        <div className="flex justify-end mt-4 space-x-3">
            <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
                <Download className="w-4 h-4" />
                Exportar Datos
            </button>
            <button
                onClick={exportToPDF}
                disabled={exporting}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm"
            >
                {exporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                    <FileText className="w-4 h-4" />
                )}
                {exporting ? 'Generando...' : 'PDF Reporte'}
            </button>
            <button
                onClick={exportCompleteReport}
                disabled={exporting}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
            >
                {exporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                )}
                {exporting ? 'Generando...' : 'Reporte Completo'}
            </button>
        </div>
    );
};
