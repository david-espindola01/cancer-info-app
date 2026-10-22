import type { Metadata } from "next";
import { UploadPanel } from "./upload-panel";

export const metadata: Metadata = {
  title: "Subir artículos",
  robots: { index: false, follow: false },
};

export default function Upload() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Subir artículos</h1>
      <p className="mt-2">Los PDF se leen en tu navegador: al servidor solo llega su texto.</p>
      <UploadPanel />
    </main>
  );
}
