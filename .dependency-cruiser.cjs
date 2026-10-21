/**
 * Reglas de arquitectura: las dependencias solo apuntan hacia adentro
 * (app → aplicacion → dominio). Cada capa explica sus reglas en su README.
 */
const noEsPrueba = "\\.test\\.tsx?$";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "sin-ciclos",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "dominio-es-puro",
      comment: "dominio/ solo puede usar dominio/ y módulos nativos de Node.",
      severity: "error",
      from: { path: "^src/dominio/", pathNot: noEsPrueba },
      to: { pathNot: "^src/dominio/", dependencyTypesNot: ["core"] },
    },
    {
      name: "aplicacion-solo-depende-de-dominio",
      comment:
        "aplicacion/ depende de puertos (interfaces), no de implementaciones. " +
        "Puede usar Skillet (@hashbrownai/core) para definir los contratos de salida de los agentes.",
      severity: "error",
      from: { path: "^src/aplicacion/", pathNot: noEsPrueba },
      to: {
        pathNot: ["^src/(dominio|aplicacion)/", "^node_modules/@hashbrownai/core/"],
        dependencyTypesNot: ["core"],
      },
    },
    {
      name: "ui-contratos-sin-react",
      comment: "ui-contratos/ se comparte con el servidor: sin React ni infraestructura.",
      severity: "error",
      from: { path: "^src/ui-contratos/", pathNot: noEsPrueba },
      to: {
        pathNot: [
          "^src/(dominio|ui-contratos)/",
          "^node_modules/@hashbrownai/core/",
        ],
        dependencyTypesNot: ["core"],
      },
    },
    {
      name: "ui-no-conoce-el-servidor",
      severity: "error",
      from: { path: "^src/ui/" },
      to: { path: "^src/(aplicacion|infraestructura)/" },
    },
    {
      name: "infraestructura-no-conoce-la-entrega",
      severity: "error",
      from: { path: "^src/infraestructura/" },
      to: { path: "^src/(app|ui)/" },
    },
    {
      name: "app-usa-infraestructura-solo-por-el-contenedor",
      severity: "error",
      from: { path: "^src/app/" },
      to: {
        path: "^src/infraestructura/",
        pathNot: "^src/infraestructura/contenedor\\.ts$",
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
};
