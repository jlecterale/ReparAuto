export default function ProfileLoggedOut({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 text-center">
      <i className="fa-solid fa-circle-user text-6xl text-brand-300 mb-3"></i>
      <h2 className="text-xl font-extrabold text-brand-900">Área do Utilizador</h2>
      <p className="text-gray-500 text-sm mb-5">
        Faça login para gerir os seus anúncios e consultar favoritos de forma persistente.
      </p>
      <button
        onClick={onLogin}
        className="w-full bg-brand-900 hover:bg-brand-800 text-white font-bold py-3 rounded-xl mb-3 transition"
      >
        <i className="fa-solid fa-right-to-bracket mr-2"></i> Entrar ou Criar Conta
      </button>
      <p className="text-xs text-gray-400">Ao entrar, concorda com os Termos da ReparAuto.</p>
    </div>
  );
}
