
/**
 * Simple Firebase Admin SDK initializer.
 * Replace backend/serviceAccountKey.json with your Firebase service account JSON.
 */
const admin = require('firebase-admin');
const path = require('path');
module.exports = function initFirebase(){
  try{
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || 'your-bucket.appspot.com')
    });
    console.log('Firebase admin initialized');
  }catch(e){
    console.warn('Firebase admin not initialized - provide serviceAccountKey.json in backend/ for full features.');
  }
}
