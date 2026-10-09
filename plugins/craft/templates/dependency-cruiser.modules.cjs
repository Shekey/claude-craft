const SRC = "src";
const MODULES = `${SRC}/modules`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "modules-public-api",
      comment: "modules talk to each other only through their index file",
      severity: "error",
      from: { path: `^${MODULES}/([^/]+)/` },
      to: {
        path: `^${MODULES}/`,
        pathNot: `^${MODULES}/$1/|^${MODULES}/[^/]+/index\\.[cm]?[jt]s$`,
      },
    },
    {
      name: "shared-does-not-import-modules",
      severity: "error",
      from: { path: `^${SRC}/shared/` },
      to: { path: `^${MODULES}/` },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.(test|spec)\\.[cm]?[jt]s$" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
