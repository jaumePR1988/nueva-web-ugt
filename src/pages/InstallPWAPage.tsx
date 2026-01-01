import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePWA_Inteligente as usePWA } from '../hooks/usePWA_Inteligente';
import {
    Download,
    Smartphone,
    Zap,
    Bell,
    WifiOff,
    ChevronRight,
    Monitor,
    Apple,
    Chrome as GoogleIcon,
    Share,
    PlusSquare,
    MoreVertical,
    CheckCircle2
} from 'lucide-react';

export default function InstallPWAPage() {
    const { state, install } = usePWA();

    const benefits = [
        {
            icon: <Zap className="h-6 w-6 text-yellow-500" />,
            title: "Acceso Instantáneo",
            description: "Abre el portal con un solo toque desde tu pantalla de inicio, sin escribir la URL."
        },
        {
            icon: <Bell className="h-6 w-6 text-red-500" />,
            title: "Notificaciones Críticas",
            description: "Recibe alertas de última hora sobre convenios, nóminas e incidencias en tiempo real."
        },
        {
            icon: <WifiOff className="h-6 w-6 text-blue-500" />,
            title: "Modo Offline",
            description: "Consulta los últimos comunicados y documentos descargables incluso sin conexión."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-[3rem] p-8 md:p-12 mb-12 shadow-2xl shadow-red-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 text-center md:text-left md:flex items-center gap-12">
                        <div className="md:w-2/3">
                            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-6">
                                App Oficial UGT Towa
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                                Lleva tu sindicato <br />en el bolsillo
                            </h1>
                            <p className="text-red-50 text-xl font-medium mb-8 leading-relaxed max-w-lg">
                                Instala nuestra aplicación para una experiencia más rápida, segura y siempre disponible.
                            </p>

                            {!state.isInstalled ? (
                                <button
                                    onClick={install}
                                    className="bg-white text-red-600 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto md:mx-0"
                                >
                                    <Download className="h-5 w-5" />
                                    Instalar ahora
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl w-fit mx-auto md:mx-0 border border-white/30">
                                    <CheckCircle2 className="h-6 w-6 text-green-300" />
                                    <span className="text-white font-bold">App instalada correctamente</span>
                                </div>
                            )}
                        </div>

                        <div className="hidden md:block md:w-1/3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-400 blur-3xl opacity-30 animate-pulse"></div>
                                <Smartphone className="h-64 w-64 text-white/20 rotate-12 relative z-10" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {benefits.map((benefit, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                            <div className="mb-6 p-4 bg-slate-50 w-fit rounded-2xl group-hover:scale-110 transition-transform">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-4">{benefit.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{benefit.description}</p>
                        </div>
                    ))}
                </div>

                {/* Installation Instructions */}
                <section className="bg-white rounded-[3rem] p-10 md:p-16 shadow-sm border border-slate-100 mb-16">
                    <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">¿Cómo instalarla?</h2>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* iOS Instructions */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-slate-900 rounded-2xl">
                                    <Apple className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Apple iOS (iPhone / iPad)</h3>
                            </div>

                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 font-black flex items-center justify-center">1</span>
                                    <p className="text-slate-600 font-medium">Abre <strong>Safari</strong> y entra en <span className="text-red-600">towa-ugt.cat</span></p>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 font-black flex items-center justify-center">2</span>
                                    <p className="text-slate-600 font-medium flex items-center gap-2">
                                        Pulsa el botón de <strong>Compartir</strong> <Share className="h-5 w-5 inline text-blue-500" /> situado abajo en la barra central.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 font-black flex items-center justify-center">3</span>
                                    <p className="text-slate-600 font-medium flex items-center gap-2">
                                        Desliza hacia abajo y elige la opción <strong>"Añadir a la pantalla de inicio"</strong> <PlusSquare className="h-5 w-5 inline" />.
                                    </p>
                                </li>
                            </ul>
                        </div>

                        {/* Android/Chrome Instructions */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-600 rounded-2xl">
                                    <GoogleIcon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Android / Chrome</h3>
                            </div>

                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 font-black flex items-center justify-center">1</span>
                                    <p className="text-slate-600 font-medium">Entra con <strong>Google Chrome</strong> en el portal.</p>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 font-black flex items-center justify-center">2</span>
                                    <p className="text-slate-600 font-medium flex items-center gap-2">
                                        Si no te aparece el aviso automático, pulsa el menú <MoreVertical className="h-5 w-5 inline" /> (tres puntos arriba a la derecha).
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 font-black flex items-center justify-center">3</span>
                                    <p className="text-slate-600 font-medium">
                                        Elige <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.
                                    </p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Offline Documents - The "HOOK" */}
                <section className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center text-white shadow-2xl overflow-hidden relative">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-[100px] -mb-20 -mr-20"></div>

                    <div className="relative z-10">
                        <div className="mb-8 p-6 bg-white/10 w-fit mx-auto rounded-full backdrop-blur-md">
                            <Monitor className="h-10 w-10 text-red-500" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Acceso VIP a Documentos</h2>
                        <p className="text-slate-400 text-lg font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                            Al instalar la app, podrás desbloquear la lectura offline de los Convenios Colectivos y Tablas Salariales. Consulta tus derechos sin gastar datos.
                        </p>

                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-red-500 font-black uppercase tracking-widest text-sm flex items-center gap-2 mx-auto hover:gap-4 transition-all"
                        >
                            Volver arriba para instalar
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
