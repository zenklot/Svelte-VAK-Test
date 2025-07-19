import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyAeRAeo9LczsrCoDO9R7tw5eHGPPw1g9sE',
	authDomain: 'vak-test-9daba.firebaseapp.com',
	projectId: 'vak-test-9daba',
	storageBucket: 'vak-test-9daba.firebasestorage.app',
	messagingSenderId: '1026588286289',
	appId: '1:1026588286289:web:11027eb2238919d97c4770',
	measurementId: 'G-FCT8E4GL26'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
