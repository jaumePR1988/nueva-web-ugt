import React from 'react';
import { AlertTriangle, Settings, ExternalLink } from 'lucide-react';

interface ConfigErrorBoundaryState {
  hasConfigError: boolean;
  error: Error | null;
}

export class ConfigErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ConfigErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasConfigError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ConfigErrorBoundaryState {
    // Detectar errores de configuración de Supabase
    if (error.message && error.message.includes('variables de entorno')) {
      return { hasConfigError: true, error };
    }
    return { hasConfigError: true, error };
  }

  render() {
    if (this.state.hasConfigError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración Requerida</h1>
                <p className="text-gray-600">UGT TOWA Portal necesita ser configurado</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="font-semibold text-blue-900 mb-2">🔧 Pasos para configurar la aplicación:</h2>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li>Duplica el archivo <code className="bg-blue-100 px-2 py-1 rounded text-sm">.env.example</code> como <code className="bg-blue-100 px-2 py-1 rounded text-sm">.env</code></li>
                  <li>Abre el archivo <code className="bg-blue-100 px-2 py-1 rounded text-sm">.env</code></li>
                  <li>Ve a tu proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                    Supabase Dashboard <ExternalLink className="h-4 w-4 ml-1" />
                  </a></li>
                  <li>Copia <code className="bg-blue-100 px-2 py-1 rounded text-sm">Project URL</code> → <code className="bg-blue-100 px-2 py-1 rounded text-sm">VITE_SUPABASE_URL</code></li>
                  <li>Copia <code className="bg-blue-100 px-2 py-1 rounded text-sm">anon public</code> key → <code className="bg-blue-100 px-2 py-1 rounded text-sm">VITE_SUPABASE_ANON_KEY</code></li>
                  <li>Guarda el archivo <code className="bg-blue-100 px-2 py-1 rounded text-sm">.env</code></li>
                  <li>Reinicia el servidor de desarrollo</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">📍 Dónde encontrar las credenciales:</h3>
                <div className="space-y-2 text-yellow-800">
                  <p><strong>Supabase Dashboard:</strong> <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">supabase.com/dashboard</a></p>
                  <p><strong>Settings → API:</strong> Ve a tu proyecto → Settings → API</p>
                  <p><strong>Project URL:</strong> Copia la URL del proyecto (debe terminar en .supabase.co)</p>
                  <p><strong>anon key:</strong> Copia la clave pública (debe empezar con "eyJ")</p>
                </div>
              </div>

              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ Error detectado:</h3>
                  <pre className="text-red-800 text-sm overflow-x-auto">{this.state.error.message}</pre>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Una vez configurado:</h3>
                <p className="text-green-800">La aplicación se cargará automáticamente con todas las funcionalidades del portal UGT TOWA.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}