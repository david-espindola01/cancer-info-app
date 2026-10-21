import { randomUUID } from "node:crypto";
import type { Documento, EstadoDocumento, Fragmento } from "@/dominio/documento";
import type { NotasFragmento } from "@/aplicacion/lectura/esquemas";
import type { NuevoDocumento, RepositorioDocumentos } from "@/aplicacion/puertos";

interface FragmentoGuardado extends Fragmento {
  notas: NotasFragmento | null;
}

/** Implementación en memoria para pruebas de casos de uso (mismo contrato que la de Postgres). */
export class RepositorioDocumentosMemoria implements RepositorioDocumentos {
  private readonly documentos: Documento[] = [];
  private readonly fragmentos: FragmentoGuardado[] = [];

  async registrar({ titulo, huella, fragmentos }: NuevoDocumento) {
    const existente = this.documentos.find((documento) => documento.huella === huella);
    if (existente) return { documento: { ...existente }, creado: false };

    const documento: Documento = {
      id: randomUUID(),
      titulo,
      huella,
      estado: "pendiente",
      error: null,
      creadoEn: new Date(),
    };
    this.documentos.unshift(documento);
    fragmentos.forEach((texto, orden) =>
      this.fragmentos.push({ documentoId: documento.id, orden, texto, notas: null }),
    );
    return { documento: { ...documento }, creado: true };
  }

  async obtener(id: string) {
    const documento = this.documentos.find((d) => d.id === id);
    return documento ? { ...documento } : null;
  }

  async listar() {
    return this.documentos.map((documento) => ({ ...documento }));
  }

  async cambiarEstado(id: string, estado: EstadoDocumento, error?: string) {
    const documento = this.documentos.find((d) => d.id === id);
    if (documento) Object.assign(documento, { estado, error: error ?? null });
  }

  async siguienteFragmentoPendiente(documentoId: string) {
    const pendiente = this.fragmentosDe(documentoId).find((fragmento) => fragmento.notas === null);
    return pendiente ? { documentoId, orden: pendiente.orden, texto: pendiente.texto } : null;
  }

  async guardarNotas(documentoId: string, orden: number, notas: NotasFragmento) {
    const fragmento = this.fragmentosDe(documentoId).find((f) => f.orden === orden);
    if (fragmento) fragmento.notas = notas;
  }

  async listarNotas(documentoId: string) {
    return this.fragmentosDe(documentoId).flatMap((fragmento) => (fragmento.notas ? [fragmento.notas] : []));
  }

  private fragmentosDe(documentoId: string) {
    return this.fragmentos
      .filter((fragmento) => fragmento.documentoId === documentoId)
      .sort((a, b) => a.orden - b.orden);
  }
}
