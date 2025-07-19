import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function saveResultToFirebase(result: any): Promise<boolean> {
	try {
		await addDoc(collection(db, 'results'), result);
		console.log('Data tersimpan di Firebase');
		return true;
	} catch (error) {
		console.error('Gagal menyimpan ke Firebase:', error);
		return false;
	}
}
