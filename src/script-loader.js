import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { getDb } from './firebase-config.js';
import { createRequire } from 'module';
import { transformSync } from '@babel/core';

const transformESModules = (code, filename) => {
  try {
    const result = transformSync(code, {
      filename: filename,
      presets: [
        ['@babel/preset-env', {
          modules: 'commonjs',
          targets: {
            node: 'current'
          },
          useBuiltIns: false,
          corejs: false,
          loose: true
        }]
      ],
      compact: false,
      comments: true,
      babelrc: false,
      configFile: false
    });
    
    return result.code;
  } catch (error) {
    console.warn(`Warning: Babel transformation failed, using original code: ${error.message}`);
    return code;
  }
};

export const loadScript = async (scriptPath) => {
  try {
    const files = await readdir(scriptPath);
    const jsFiles = files.filter(file => extname(file) === '.js');
    
    const modules = {};
    
    for (const file of jsFiles) {
      const filePath = join(scriptPath, file);
      
      try {
        // Leer archivo como texto
        let fileContent = await readFile(filePath, 'utf8');
        
        // Transformar sintaxis ES modules a CommonJS
        fileContent = transformESModules(fileContent, filePath);
        
        // Crear contexto para evaluar el script
        const moduleExports = {};
        const moduleContext = {
          exports: moduleExports,
          module: { exports: moduleExports },
          require: createRequire(import.meta.url),
          __filename: filePath,
          __dirname: scriptPath,
          console,
          global,
          process,
          Buffer,
          db: null // Se inyectará cuando se ejecute
        };
        
        // Evaluar el código en el contexto
        const wrappedCode = `
          (function(exports, module, require, __filename, __dirname, console, global, process, Buffer, db) {
            // Soporte para ES modules
            const exportedFunctions = {};
            
            // Mock para export
            global.export = function(name, value) {
              exportedFunctions[name] = value;
              exports[name] = value;
            };
            
            // Ejecutar el código
            ${fileContent}
            
            // Si se usó export default, agregarlo
            if (typeof module.exports.default !== 'undefined') {
              Object.assign(exports, module.exports.default);
            }
            
            // Si se usaron exports individuales, agregarlos
            Object.assign(exports, exportedFunctions);
            
            return module.exports;
          })
        `;
        
        const moduleFunction = eval(wrappedCode);
        const result = moduleFunction(
          moduleContext.exports,
          moduleContext.module,
          moduleContext.require,
          moduleContext.__filename,
          moduleContext.__dirname,
          moduleContext.console,
          moduleContext.global,
          moduleContext.process,
          moduleContext.Buffer,
          moduleContext.db
        );
        
        modules[file] = result;
      } catch (evalError) {
        console.warn(`Warning: Could not load ${file}: ${evalError.message}`);
        continue;
      }
    }
    
    if (Object.keys(modules).length === 0) {
      throw new Error('No valid modules found. Make sure your scripts export functions');
    }
    
    return modules;
  } catch (error) {
    throw new Error(`Failed to load scripts: ${error.message}`);
  }
};

export const listFunctions = async (scriptPath) => {
  const modules = await loadScript(scriptPath);
  const functions = [];
  
  Object.entries(modules).forEach(([fileName, module]) => {
    Object.keys(module).forEach(exportName => {
      if (typeof module[exportName] === 'function') {
        const func = module[exportName];
        const params = getFunctionParameters(func);
        const displayName = params.length > 0 
          ? `${fileName}:${exportName}(${params.join(', ')})`
          : `${fileName}:${exportName}()`;
        functions.push({
          name: `${fileName}:${exportName}`,
          displayName,
          parameters: params
        });
      }
    });
  });
  
  return functions;
};

const getFunctionParameters = (func) => {
  const funcStr = func.toString();
  
  // Extract parameters from function signature
  const match = funcStr.match(/(?:async\s+)?(?:function\s*)?[^(]*\(([^)]*)\)/);
  if (!match || !match[1].trim()) return [];
  
  return match[1]
    .split(',')
    .map(param => {
      // Remove default values and destructuring
      const cleanParam = param.trim().split('=')[0].trim();
      // Handle destructuring
      if (cleanParam.startsWith('{') || cleanParam.startsWith('[')) {
        return cleanParam;
      }
      return cleanParam;
    })
    .filter(param => param.length > 0);
};

export const executeFunction = async (scriptPath, functionName, providedArgs = []) => {
  // Primero obtener la instancia de db
  const dbInstance = getDb();
  
  // Cargar módulos con db inyectada
  const modules = await loadScriptWithDb(scriptPath, dbInstance);
  
  // Parse function name (file:function or just function)
  let targetFile, targetFunction;
  
  if (functionName.includes(':')) {
    [targetFile, targetFunction] = functionName.split(':');
  } else {
    // Search for function in all modules
    for (const [fileName, module] of Object.entries(modules)) {
      if (module[functionName]) {
        targetFile = fileName;
        targetFunction = functionName;
        break;
      }
    }
  }
  
  if (!targetFile || !modules[targetFile]) {
    throw new Error(`File not found: ${targetFile}`);
  }
  
  const targetModule = modules[targetFile];
  const func = targetModule[targetFunction];
  
  if (!func || typeof func !== 'function') {
    throw new Error(`Function not found: ${targetFunction} in ${targetFile}`);
  }
  
  // Get function parameters
  const parameters = getFunctionParameters(func);
  
  try {
    let result;
    
    if (parameters.length > 0 && providedArgs.length === 0) {
      // Need to prompt for arguments
      const { promptForArguments } = await import('./interactive.js');
      const args = await promptForArguments(parameters, targetFunction);
      result = await func(...args);
    } else if (providedArgs.length > 0) {
      // Use provided arguments
      result = await func(...providedArgs);
    } else {
      // No parameters needed
      result = await func();
    }
    
    return result;
  } catch (error) {
    throw new Error(`Error executing function: ${error.message}`);
  }
};

const loadScriptWithDb = async (scriptPath, dbInstance) => {
  try {
    const files = await readdir(scriptPath);
    const jsFiles = files.filter(file => extname(file) === '.js');
    
    const modules = {};
    
    for (const file of jsFiles) {
      const filePath = join(scriptPath, file);
      
      try {
        // Leer archivo como texto
        let fileContent = await readFile(filePath, 'utf8');
        
        // Transformar sintaxis ES modules a CommonJS
        fileContent = transformESModules(fileContent, filePath);
        
        // Crear contexto para evaluar el script
        const moduleExports = {};
        const moduleContext = {
          exports: moduleExports,
          module: { exports: moduleExports },
          require: createRequire(import.meta.url),
          __filename: filePath,
          __dirname: scriptPath,
          console,
          global,
          process,
          Buffer,
          db: dbInstance // Inyectar db real
        };
        
        // Evaluar el código en el contexto
        const wrappedCode = `
          (function(exports, module, require, __filename, __dirname, console, global, process, Buffer, db) {
            ${fileContent}
            return module.exports;
          })
        `;
        
        const moduleFunction = eval(wrappedCode);
        const result = moduleFunction(
          moduleContext.exports,
          moduleContext.module,
          moduleContext.require,
          moduleContext.__filename,
          moduleContext.__dirname,
          moduleContext.console,
          moduleContext.global,
          moduleContext.process,
          moduleContext.Buffer,
          moduleContext.db
        );
        
        modules[file] = result;
      } catch (evalError) {
        console.warn(`Warning: Could not load ${file}: ${evalError.message}`);
        continue;
      }
    }
    
    return modules;
  } catch (error) {
    throw new Error(`Failed to load scripts: ${error.message}`);
  }
}; 