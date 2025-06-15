const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const inquirer = require('inquirer').default;

const firebaseConfig = {
  apiKey: "AIzaSyA5Lsxqplxa4eQ9H8Zap3e95R_-SFGe2yU",
  authDomain: "alien-outrider-453003-g8.firebaseapp.com",
  projectId: "alien-outrider-453003-g8",
  storageBucket: "alien-outrider-453003-g8.firebasestorage.app",
  messagingSenderId: "398044917472",
  appId: "1:398044917472:web:4ec00f19fafe5523442a85",
  measurementId: "G-J6BPHF1V0Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userCounter = 1;

const generateRandomName = () => {
  const firstNames = ['Ahmad', 'Siti', 'Muhammad', 'Fatimah', 'Ali', 'Khadijah', 'Omar', 'Aisha', 'Ibrahim', 'Maryam'];
  const lastNames = ['Rahman', 'Abdullah', 'Hasan', 'Husain', 'Malik', 'Zahra', 'Saleh', 'Noor', 'Yusuf', 'Layla'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
};

const generateRandomPhone = () => {
  const prefixes = ['0812', '0813', '0821', '0822', '0851', '0852'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}${number}`;
};

const generateUserData = async () => {
  let currentCounter = userCounter;
  let success = false;
  
  while (!success) {
    const email = `user${currentCounter}@gmail.com`;
    const password = 'admin123';
    const name = generateRandomName();
    const phone = generateRandomPhone();
    
    try {
      console.log(`\n🔄 Generating user data...`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔐 Password: ${password}`);
      console.log(`👤 Name: ${name}`);
      console.log(`📱 Phone: ${phone}`);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name: name,
        phone: phone,
        role: 'wali',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ User ${currentCounter} created successfully!`);
      console.log(`🆔 UID: ${user.uid}\n`);
      
      userCounter = currentCounter + 1;
      success = true;
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ Email ${email} already exists, trying next number...`);
        currentCounter++;
      } else {
        console.error(`❌ Failed to create user: ${error.message}\n`);
        break;
      }
    }
  }
};

const showMenu = async () => {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Pilih menu:',
        choices: [
          { name: '👤 Generate User Data', value: 'generate' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ]);
    
    switch (answers.action) {
      case 'generate':
        await generateUserData();
        await showMenu();
        break;
      case 'exit':
        console.log('👋 Goodbye!');
        process.exit(0);
        break;
    }
  } catch (error) {
    if (error.isTtyError) {
      console.log('❌ Prompt couldn\'t be rendered in the current environment');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
};

// Initialize and show menu
const initialize = async () => {
  try {
    console.log('🚀 ESP32 Data Generator Started');
    console.log('🔥 Connected to Firebase\n');
    
    await showMenu();
  } catch (error) {
    console.error('❌ Failed to initialize:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

// Start the application
initialize();