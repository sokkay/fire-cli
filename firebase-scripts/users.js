// Example script for Firebase operations
// The 'db' variable is injected globally by fire-cli

export const getUsers = async () => {
  const snap = await db.collection('Usuarios').get();
  return snap;
};

export const getUserById = async (userId = 'test-user') => {
  const doc = await db.collection('Usuarios').doc(userId).get();
  
  if (!doc.exists) {
    return { error: 'User not found' };
  }
  
  return {
    id: doc.id,
    ...doc.data()
  };
};

export const getUsersByAge = async (minAge, maxAge = 100) => {
  const snap = await db.collection('Usuarios')
    .where('age', '>=', minAge)
    .where('age', '<=', maxAge)
    .get();
  
  return snap;
};

export const createUser = async (name, email, age) => {
  const docRef = await db.collection('Usuarios').add({
    name,
    email,
    age: parseInt(age),
    createdAt: new Date(),
    active: true
  });
  
  return {
    id: docRef.id,
    message: `User created successfully with ID: ${docRef.id}`
  };
};

export const updateUserStatus = async (userId, isActive) => {
  await db.collection('Usuarios').doc(userId).update({
    active: isActive,
    updatedAt: new Date()
  });
  
  return {
    message: `User ${userId} status updated to ${isActive ? 'active' : 'inactive'}`
  };
};

export const getUsersCount = async () => {
  const snap = await db.collection('Usuarios').get();
  return {
    count: snap.size,
    message: `Total users: ${snap.size}`
  };
};

export const getActiveUsers = async () => {
  const snap = await db.collection('Usuarios')
    .where('active', '==', true)
    .get();
  
  return snap;
}; 