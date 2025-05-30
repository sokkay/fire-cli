import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import chalk from 'chalk';

let db = null;

export const initFirebase = async (configPath) => {
  try {
    if (!existsSync(configPath)) {
      throw new Error(`Firebase config file not found: ${configPath}`);
    }

    const serviceAccount = JSON.parse(await readFile(configPath, 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    db = admin.firestore();
    console.log(chalk.green('✅ Firebase initialized successfully'));
    
    return db;
  } catch (error) {
    throw new Error(`Failed to initialize Firebase: ${error.message}`);
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initFirebase() first.');
  }
  return db;
};

// Export db for use in scripts
export { db }; 