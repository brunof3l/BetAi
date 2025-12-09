import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const isAdmin = (session?.user as any)?.isAdmin === true;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Painel Administrativo</h1>
      <p className="mt-2 text-sm text-gray-600">Acesso restrito a administradores.</p>

      <section className="mt-6 space-y-2">
        <div className="text-sm">Usuário: <span className="font-medium">{email}</span></div>
        <div className="text-sm">isAdmin: <span className="font-medium">{String(isAdmin)}</span></div>
      </section>

      <section className="mt-8">
        <div className="rounded border p-4">
          <p className="text-sm">Aqui você pode gerenciar operações administrativas futuramente.</p>
        </div>
      </section>
    </main>
  );
}