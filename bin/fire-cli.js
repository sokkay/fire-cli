#!/usr/bin/env node

import { Command } from "commander";
import {
  loadScript,
  listFunctions,
  executeFunction,
} from "../src/script-loader.js";
import { initFirebase } from "../src/firebase-config.js";
import {
  getDefaultScriptsDirectory,
  getDefaultFirebaseKeyPath,
  createConfigExample,
} from "../src/config.js";
import chalk from "chalk";

const program = new Command();

program
  .name("fire-cli")
  .description("CLI tool for executing Firebase scripts")
  .version("1.0.2");

// Comando para generar archivo de configuración de ejemplo
program
  .command("init-config")
  .description("Create a sample configuration file")
  .action(() => {
    console.log(chalk.green("📝 Sample configuration file (.fire-cli.json):"));
    console.log(createConfigExample());
    console.log(chalk.yellow("\n💡 You can place this file in:"));
    console.log("  - Current directory: .fire-cli.json");
    console.log("  - Home directory: ~/.fire-cli.json");
    console.log("  - Config directory: ~/.config/fire-cli.json");
  });

program
  .option(
    "-s, --load-script <path>",
    "Path to the script directory (overrides config)"
  )
  .option("-l, --list", "List available functions")
  .option("-e, --execute <function>", "Execute a specific function")
  .option(
    "-c, --config <path>",
    "Path to Firebase service account key (overrides config)"
  )
  .option("-t, --table", "Display results in table format (default: JSON)")
  .option("-a, --args <args...>", "Arguments to pass to the function")
  .action(async (options) => {
    try {
      // Usar configuraciones por defecto si no se especifican opciones
      const scriptsDirectory =
        options.loadScript || (await getDefaultScriptsDirectory());
      const firebaseKeyPath =
        options.config || (await getDefaultFirebaseKeyPath());

      // Initialize Firebase
      await initFirebase(firebaseKeyPath);

      if (options.list) {
        // Solo listar funciones, sin selección interactiva
        const functions = await listFunctions(scriptsDirectory);
        console.log(chalk.green("\n📋 Available functions:"));
        functions.forEach((fn, index) => {
          console.log(chalk.cyan(`  ${index + 1}. ${fn.displayName}`));
        });
        return;
      }

      if (options.execute) {
        // Ejecutar función específica
        console.log(chalk.yellow(`\n🚀 Executing: ${options.execute}`));

        // Parse arguments if provided
        const args = options.args ? parseCliArguments(options.args) : [];

        const result = await executeFunction(
          scriptsDirectory,
          options.execute,
          args
        );

        const { displayResults } = await import("../src/display.js");
        displayResults(result, options.execute, options.table);
        return;
      }

      // Comportamiento por defecto: selección interactiva
      const functions = await listFunctions(scriptsDirectory);
      const { selectFunction } = await import("../src/interactive.js");
      const selectedFunction = await selectFunction(functions);

      if (selectedFunction) {
        console.log(chalk.yellow(`\n🚀 Executing: ${selectedFunction}`));
        const result = await executeFunction(
          scriptsDirectory,
          selectedFunction
        );

        const { displayResults } = await import("../src/display.js");
        displayResults(result, selectedFunction, options.table);
      }
    } catch (error) {
      console.error(chalk.red("❌ Error:"), error.message);
      process.exit(1);
    }
  });

const parseCliArguments = (args) => {
  return args.map((arg) => {
    // Handle special values
    if (arg === "null") return null;
    if (arg === "undefined") return undefined;
    if (arg === "true") return true;
    if (arg === "false") return false;

    // Try to parse as number
    if (!isNaN(arg) && !isNaN(parseFloat(arg))) {
      return parseFloat(arg);
    }

    // Try to parse as JSON
    if (
      (arg.startsWith("{") && arg.endsWith("}")) ||
      (arg.startsWith("[") && arg.endsWith("]"))
    ) {
      try {
        return JSON.parse(arg);
      } catch (e) {
        // If JSON parsing fails, return as string
      }
    }

    return arg;
  });
};

program.parse();
