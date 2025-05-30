import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

const DEFAULT_CONFIG = {
  scriptsDirectory: './firebase-scripts',
  firebaseKeyPath: './firebase-key.json'
};

const CONFIG_LOCATIONS = [
  join(process.cwd(), '.fire-cli.json'),
  join(homedir(), '.fire-cli.json'),
  join(homedir(), '.config', 'fire-cli.json'),
];

let cachedConfig = null;

export const loadConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  let config = { ...DEFAULT_CONFIG };

  // Buscar archivo de configuración en las ubicaciones predefinidas
  for (const configPath of CONFIG_LOCATIONS) {
    if (existsSync(configPath)) {
      try {
        const configFile = await readFile(configPath, 'utf8');
        const userConfig = JSON.parse(configFile);
        config = { ...config, ...userConfig };
        break;
      } catch (error) {
        console.warn(`Warning: Could not parse config file ${configPath}: ${error.message}`);
      }
    }
  }

  // Resolver rutas relativas desde el directorio de trabajo actual
  config.scriptsDirectory = resolve(process.cwd(), config.scriptsDirectory);
  config.firebaseKeyPath = resolve(process.cwd(), config.firebaseKeyPath);

  cachedConfig = config;
  return config;
};

export const getDefaultScriptsDirectory = async () => {
  const config = await loadConfig();
  return config.scriptsDirectory;
};

export const getDefaultFirebaseKeyPath = async () => {
  const config = await loadConfig();
  return config.firebaseKeyPath;
};

export const createConfigExample = () => {
  return JSON.stringify({
    scriptsDirectory: "./scripts",
    firebaseKeyPath: "./firebase-key.json"
  }, null, 2);
}; 