// ============ FIREBASE STORAGE UPLOAD ============
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadFileToStorage(
  file: File,
  folder: string,
  fileName: string,
): Promise<string> {
  const path = `${folder}/${fileName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
