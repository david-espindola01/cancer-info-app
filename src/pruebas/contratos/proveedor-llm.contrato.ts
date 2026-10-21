import { s } from "@hashbrownai/core";
import { RespuestaInvalida } from "@/aplicacion/errores-llm";
import type { ProveedorLLM } from "@/aplicacion/puertos";

const esquema = s.object("Prueba", { nombre: s.string("Un nombre"), edad: s.number("Una edad") });
const peticion = { nombre: "prueba", sistema: "sistema", usuario: "usuario", esquema };

/**
 * Pruebas que todo ProveedorLLM debe pasar. `crear` recibe lo que el modelo
 * «responde» y devuelve un proveedor que lo entregará.
 */
export function contratoProveedorLLM(crear: (respuestaDelModelo: unknown) => ProveedorLLM) {
  it("devuelve la respuesta cuando cumple el esquema", async () => {
    const proveedor = crear({ nombre: "Ana", edad: 40 });

    expect(await proveedor.generarJson(peticion)).toEqual({ nombre: "Ana", edad: 40 });
  });

  it("lanza RespuestaInvalida cuando la respuesta no cumple el esquema", async () => {
    const proveedor = crear({ nombre: "Ana" });

    await expect(proveedor.generarJson(peticion)).rejects.toBeInstanceOf(RespuestaInvalida);
  });
}
