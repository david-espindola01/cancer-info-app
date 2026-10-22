"use client";

import { useState, type ChangeEvent } from "react";
import { sendDocument } from "./api-client";
import { extractPdfText } from "./extract-pdf-text";

interface Progress {
  name: string;
  message: string;
}

export function PdfPicker({ onUpload }: { onUpload: () => void }) {
  const [progress, setProgress] = useState<Progress[]>([]);

  const note = (name: string, message: string) =>
    setProgress((current) => current.map((p) => (p.name === name ? { name, message } : p)));

  async function process(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    setProgress(files.map((file) => ({ name: file.name, message: "En cola…" })));

    for (const file of files) {
      try {
        note(file.name, "Leyendo el PDF…");
        const text = await extractPdfText(file);
        note(file.name, "Enviando…");
        const { message } = await sendDocument(file.name.replace(/\.pdf$/i, ""), text);
        note(file.name, message);
      } catch {
        note(file.name, "No se pudo leer este archivo. ¿Es un PDF válido?");
      }
    }
    onUpload();
  }

  return (
    <div className="mt-6">
      <label htmlFor="pdfs" className="font-semibold">
        Elegir artículos (PDF)
      </label>
      <input id="pdfs" type="file" accept="application/pdf" multiple onChange={process} className="mt-2 block" />
      {progress.length > 0 && (
        <ul aria-live="polite" className="mt-3 flex flex-col gap-1">
          {progress.map(({ name, message }) => (
            <li key={name}>
              <span className="font-semibold">{name}:</span> {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
