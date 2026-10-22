/**
 * Architecture rules: dependencies only point inwards
 * (app → application → domain). Each layer explains its rules in its README.
 */
const notATest = "\\.test\\.tsx?$";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-cycles",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "domain-is-pure",
      comment: "domain/ may only use domain/ and Node's built-in modules.",
      severity: "error",
      from: { path: "^src/domain/", pathNot: notATest },
      to: { pathNot: "^src/domain/", dependencyTypesNot: ["core"] },
    },
    {
      name: "application-only-depends-on-domain",
      comment:
        "application/ depends on ports (interfaces), not on implementations. " +
        "It may use Skillet (@hashbrownai/core) and the ui-contracts/ catalog (data without React) " +
        "to define what the agents must answer.",
      severity: "error",
      from: { path: "^src/application/", pathNot: notATest },
      to: {
        pathNot: ["^src/(domain|application|ui-contracts)/", "^node_modules/@hashbrownai/core/"],
        dependencyTypesNot: ["core"],
      },
    },
    {
      name: "ui-contracts-without-react",
      comment: "ui-contracts/ is shared with the server: no React or infrastructure.",
      severity: "error",
      from: { path: "^src/ui-contracts/", pathNot: notATest },
      to: {
        pathNot: ["^src/(domain|ui-contracts)/", "^node_modules/@hashbrownai/core/"],
        dependencyTypesNot: ["core"],
      },
    },
    {
      name: "ui-does-not-know-the-server",
      severity: "error",
      from: { path: "^src/ui/" },
      to: { path: "^src/(application|infrastructure)/" },
    },
    {
      name: "infrastructure-does-not-know-delivery",
      severity: "error",
      from: { path: "^src/infrastructure/" },
      to: { path: "^src/(app|ui)/" },
    },
    {
      name: "app-uses-infrastructure-only-through-the-container",
      severity: "error",
      from: { path: "^src/app/" },
      to: {
        path: "^src/infrastructure/",
        pathNot: "^src/infrastructure/container\\.ts$",
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
