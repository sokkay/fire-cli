import Table from 'cli-table3';
import chalk from 'chalk';

const MAX_CELL_WIDTH = 50; // Máximo ancho de celda

export const displayResults = (result, functionName, useTable = false) => {
  console.log(chalk.green(`\n📊 Results from ${functionName}:`));
  
  if (!result) {
    console.log(chalk.yellow('No data returned'));
    return;
  }
  
  // Handle Firestore QuerySnapshot
  if (result.docs && Array.isArray(result.docs)) {
    const docs = result.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (docs.length === 0) {
      console.log(chalk.yellow('No documents found'));
      return;
    }
    
    if (useTable) {
      displayTable(docs);
    } else {
      displayJSON(docs);
    }
    return;
  }
  
  // Handle arrays
  if (Array.isArray(result)) {
    if (result.length === 0) {
      console.log(chalk.yellow('Empty array'));
      return;
    }
    
    if (useTable) {
      displayTable(result);
    } else {
      displayJSON(result);
    }
    return;
  }
  
  // Handle single objects
  if (typeof result === 'object') {
    if (useTable) {
      displayTable([result]);
    } else {
      displayJSON(result);
    }
    return;
  }
  
  // Handle primitives
  console.log(chalk.cyan(result));
};

const displayJSON = (data) => {
  console.log(chalk.cyan(JSON.stringify(data, null, 2)));
  
  if (Array.isArray(data)) {
    console.log(chalk.green(`\n📈 Total records: ${data.length}`));
  }
  
  console.log(chalk.gray('\n💡 Use --table flag to display in table format'));
};

const truncateText = (text, maxLength = MAX_CELL_WIDTH) => {
  if (!text) return text;
  
  const trimmed = text.toString().trim();
  if (trimmed.length <= maxLength) return trimmed;
  
  return trimmed.substring(0, maxLength - 3) + '...';
};

const displayTable = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.log(chalk.yellow('No data to display'));
    return;
  }
  
  // Get all unique keys from all objects
  const allKeys = new Set();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });
  
  const keys = Array.from(allKeys);
  
  if (keys.length === 0) {
    console.log(chalk.yellow('No properties to display'));
    return;
  }
  
  // Limit columns if too many
  const maxColumns = 6;
  const displayKeys = keys.slice(0, maxColumns);
  const hiddenColumns = keys.length - displayKeys.length;
  
  // Create table with word wrap
  const table = new Table({
    head: displayKeys.map(key => chalk.cyan(truncateText(key, 15))),
    style: {
      head: [],
      border: ['grey']
    },
    wordWrap: true,
    colWidths: displayKeys.map(() => Math.min(MAX_CELL_WIDTH, Math.floor(120 / displayKeys.length)))
  });
  
  // Add rows
  data.forEach(item => {
    const row = displayKeys.map(key => {
      const value = item[key];
      
      if (value === null || value === undefined) {
        return chalk.grey('null');
      }
      
      if (typeof value === 'object') {
        const jsonStr = JSON.stringify(value);
        return chalk.yellow(truncateText(jsonStr, 30));
      }
      
      if (typeof value === 'boolean') {
        return value ? chalk.green('true') : chalk.red('false');
      }
      
      if (typeof value === 'number') {
        return chalk.magenta(truncateText(value.toString()));
      }
      
      return truncateText(value.toString(), 30);
    });
    
    table.push(row);
  });
  
  console.log(table.toString());
  console.log(chalk.green(`\n📈 Total records: ${data.length}`));
  
  if (hiddenColumns > 0) {
    console.log(chalk.yellow(`⚠️  ${hiddenColumns} columns hidden. Use JSON format to see all data.`));
  }
}; 