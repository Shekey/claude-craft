#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { cartTotal } from "./cart.js";
import { salesReport } from "./report.js";

const commands = {
  total: (file) => cartTotal(JSON.parse(readFileSync(file, "utf8")).items).toFixed(2),
  report: (file) => salesReport(JSON.parse(readFileSync(file, "utf8")).orders),
};

const [command, file] = process.argv.slice(2);
if (!commands[command] || !file) {
  console.error(`Usage: shop <${Object.keys(commands).join("|")}> <file.json>`);
  process.exit(1);
}
console.log(commands[command](file));
