// ===== إعدادات Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyDqZqjsgoG7CdTQC6cgJYq2Bl58GBd0SnA",
  authDomain: "codenames-ar.firebaseapp.com",
  databaseURL: "https://codenames-ar-default-rtdb.firebaseio.com",
  projectId: "codenames-ar",
  storageBucket: "codenames-ar.firebasestorage.app",
  messagingSenderId: "496850043713",
  appId: "1:496850043713:web:fe051576956f1de70517c0"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
