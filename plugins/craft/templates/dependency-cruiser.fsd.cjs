const SRC = "src";
const LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"];
const SLICED = "pages|widgets|features|entities";

const upwardImports = LAYERS.slice(1).map((layer, index) => ({
  name: `fsd-${layer}-imports-upward`,
  comment: `${layer} may only import layers below it`,
  severity: "error",
  from: { path: `^${SRC}/${layer}/` },
  to: { path: `^${SRC}/(${LAYERS.slice(0, index + 1).join("|")})/` },
}));

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    ...upwardImports,
    {
      name: "fsd-no-cross-slice-imports",
      comment: "slices on the same layer must not import each other",
      severity: "error",
      from: { path: `^${SRC}/(${SLICED})/([^/]+)/` },
      to: { path: `^${SRC}/$1/`, pathNot: `^${SRC}/$1/$2/` },
    },
    {
      name: "fsd-public-api",
      comment: "import other slices only through their index file",
      severity: "error",
      from: { path: `^${SRC}/([^/]+)/([^/]+)/` },
      to: {
        path: `^${SRC}/(${SLICED})/[^/]+/.+`,
        pathNot: `^${SRC}/$1/$2/|^${SRC}/(${SLICED})/[^/]+/index\\.[cm]?[jt]sx?$`,
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.(test|spec|stories)\\.[cm]?[jt]sx?$" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default"] },
  },
};
