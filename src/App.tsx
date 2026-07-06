function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="mb-6 text-7xl">🏍️</div>

        <h1 className="mb-3 text-5xl font-bold text-white">
          RideControl
        </h1>

        <p className="text-lg text-slate-400">
          Controla tu dinero.
        </p>

        <p className="text-lg text-slate-400">
          Controla tu vehículo.
        </p>

        <p className="mb-8 text-lg text-slate-400">
          Controla tu futuro.
        </p>

        <button className="rounded-xl bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-500">
          Comenzar
        </button>

        <p className="mt-8 text-sm text-slate-500">
          Versión 0.1.0
        </p>
      </div>
    </main>
  );
}

export default App;