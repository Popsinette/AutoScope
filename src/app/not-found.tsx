import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="eyebrow">Erreur 404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page introuvable</h1>
        <Link href="/" className="mt-4 inline-block text-accent-ink hover:underline">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
