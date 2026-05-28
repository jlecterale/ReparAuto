import { HashRouter, Routes, Route } from 'react-router-dom';
import AppProvider from '@/providers/AppProvider';
import { ToastProvider } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ChatModal from '@/components/chat/ChatModal';
import InstallBanner from '@/components/ui/InstallBanner';
import OfflineBanner from '@/components/ui/OfflineBanner';
import Home from '@/pages/Home';
import DetalhesCarro from '@/pages/DetalhesCarro';
import Anunciar from '@/pages/Anunciar';
import Pecas from '@/pages/Pecas';
import Perfil from '@/pages/Perfil';
import SetupPerfil from '@/pages/SetupPerfil';
import PoliticaPage from '@/pages/PoliticaPage';
import Admin from '@/pages/Admin';

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <ToastProvider>
          <OfflineBanner />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-5 w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/detalhes/:id" element={<DetalhesCarro />} />
                <Route path="/anunciar" element={<Anunciar />} />
                <Route path="/pecas" element={<Pecas />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/setup-perfil" element={<SetupPerfil />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/:tipo" element={<PoliticaPage />} />
              </Routes>
            </main>
            <Footer />
            <BottomNav />
            <ChatModal />
            <InstallBanner />
          </div>
        </ToastProvider>
      </AppProvider>
    </HashRouter>
  );
}
