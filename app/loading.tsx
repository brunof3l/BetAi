export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-2xl font-semibold text-cyan-300 animate-pulse">
          Carregando Sistema...
        </div>
        <div className="mt-2 text-cyan-500/80 text-sm">Preparando seu painel</div>
      </div>
    </div>
  );
}