import inquirer from "inquirer";
import chalk from "chalk";

export const selectFunction = async (functions) => {
  if (functions.length === 0) {
    console.log("No functions found.");
    return null;
  }

  const choices = functions.map((fn, index) => {
    // Extraer nombre del archivo sin extensión
    const fileName = fn.name.split(":")[0].replace(/\.(js|ts)$/, "");
    const functionName = fn.name.split(":")[1];
    const params =
      fn.parameters && fn.parameters.length > 0
        ? `(${fn.parameters.join(", ")})`
        : "()";

    // Detectar funciones destructivas
    const isDestructive = isDestructiveFunction(functionName);
    const warningIcon = isDestructive ? chalk.red("⚠️ ") : "";

    return {
      name: `${(index + 1)
        .toString()
        .padStart(2, " ")}. ${warningIcon}${chalk.cyan(
        fileName
      )} → ${chalk.yellow(functionName)}${chalk.gray(params)}`,
      value: fn.name,
      isDestructive,
    };
  });

  choices.push({
    name: `${chalk.red("❌ Cancel")}`,
    value: null,
  });

  const { selectedFunction } = await inquirer.prompt({
    type: "list",
    name: "selectedFunction",
    message: "Select a function to execute:",
    choices,
    pageSize: 15,
  });

  // Si se seleccionó una función destructiva, pedir confirmación
  if (selectedFunction) {
    const selectedChoice = choices.find(
      (choice) => choice.value === selectedFunction
    );
    if (selectedChoice && selectedChoice.isDestructive) {
      const confirmed = await confirmDestructiveAction(selectedFunction);
      if (!confirmed) {
        console.log(chalk.yellow("Operation cancelled."));
        return null;
      }
    }
  }

  return selectedFunction;
};

const isDestructiveFunction = (functionName) => {
  const destructiveKeywords = [
    "delete",
    "remove",
    "destroy",
    "drop",
    "clear",
    "purge",
    "wipe",
    "update",
    "edit",
    "modify",
    "change",
    "set",
    "patch",
    "create",
    "add",
    "insert",
    "save",
    "write",
    "post",
    "put",
  ];

  const lowerName = functionName.toLowerCase();
  return destructiveKeywords.some((keyword) => lowerName.includes(keyword));
};

const confirmDestructiveAction = async (functionName) => {
  console.log(
    chalk.red("\n⚠️  WARNING: This function may modify or delete data!")
  );
  console.log(chalk.yellow(`Function: ${functionName}`));

  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message: "Are you sure you want to execute this function?",
      default: false,
    },
  ]);

  return confirmed;
};

export const promptForArguments = async (parameters, functionName) => {
  console.log(
    chalk.yellow(
      `\n🔧 Function ${chalk.cyan(functionName)} requires arguments:`
    )
  );

  const args = [];

  for (const param of parameters) {
    const { value } = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message: `Enter value for parameter "${chalk.cyan(param)}":`,
        validate: (input) => {
          if (input.trim() === "") {
            return 'Parameter cannot be empty. Use "null" for null values.';
          }
          return true;
        },
      },
    ]);

    // Try to parse the value intelligently
    const parsedValue = parseValue(value.trim());
    args.push(parsedValue);

    console.log(
      chalk.gray(`  ✓ ${param} = ${chalk.cyan(JSON.stringify(parsedValue))}`)
    );
  }

  return args;
};

const parseValue = (value) => {
  // Handle special values
  if (value === "null") return null;
  if (value === "undefined") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;

  // Try to parse as number
  if (!isNaN(value) && !isNaN(parseFloat(value))) {
    return parseFloat(value);
  }

  // Try to parse as JSON (for objects/arrays)
  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]"))
  ) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // If JSON parsing fails, return as string
    }
  }

  // Return as string (remove quotes if present)
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};
