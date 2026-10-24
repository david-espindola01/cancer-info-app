"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { UploadIcon } from "@/ui/icons";
import { sendDocument } from "./api-client";
import { extractPdfText } from "./extract-pdf-text";

interface Progress {
  name: string;
  message: string;
}

const isPdf = (file: File) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);

/** A big button to choose PDFs, which also accepts them dragged onto it. */
export function PdfPicker({ onUpload }: { onUpload: () => void }) {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [dragging, setDragging] = useState(false);

  const note = (name: string, message: string) =>
    setProgress((current) => current.map((p) => (p.name === name ? { name, message } : p)));

  async function upload(files: File[]) {
    if (files.length === 0) return;
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

  function chosen(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    void upload(files);
  }

  function dropped(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void upload([...event.dataTransfer.files].filter(isPdf));
  }

  return (
    <div className="mt-6">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={dropped}
        className={`color-rio flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-(--c) p-6 text-center transition-colors ${dragging ? "bg-(--cf)" : "bg-surface"}`}
      >
        <input id="pdfs" type="file" accept="application/pdf" multiple onChange={chosen} className="peer sr-only" />
        <label
          htmlFor="pdfs"
          className="liftable flex cursor-pointer items-center gap-3 rounded-2xl bg-(--c) px-6 py-4 text-lg font-bold text-background peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--c)"
        >
          <UploadIcon />
          Elegir artículos (PDF)
        </label>
        <p className="text-base text-muted">o arrástralos aquí. Puedes elegir varios a la vez.</p>
      </div>
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
