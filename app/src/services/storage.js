import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Compress an image file before upload
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default 400px for logos)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file, maxWidth = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if wider than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload school logo to Firebase Storage
 * @param {string} schoolId - The school's ID
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The download URL
 */
export async function uploadSchoolLogo(schoolId, file) {
  if (!schoolId) throw new Error('School ID is required');
  if (!file) throw new Error('File is required');

  // Compress the image first
  const compressedBlob = await compressImage(file, 400, 0.85);

  // Create a reference to the logo location
  const logoRef = ref(storage, `schools/${schoolId}/logo.jpg`);

  // Upload the compressed image
  const snapshot = await uploadBytes(logoRef, compressedBlob, {
    contentType: 'image/jpeg',
  });

  // Get and return the download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Delete school logo from Firebase Storage
 * @param {string} schoolId - The school's ID
 */
export async function deleteSchoolLogo(schoolId) {
  if (!schoolId) throw new Error('School ID is required');

  const logoRef = ref(storage, `schools/${schoolId}/logo.jpg`);

  try {
    await deleteObject(logoRef);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}

/**
 * Upload a generic file to Firebase Storage
 * @param {string} path - The storage path
 * @param {File|Blob} file - The file to upload
 * @param {string} contentType - The file's content type
 * @returns {Promise<string>} - The download URL
 */
export async function uploadFile(path, file, contentType) {
  const fileRef = ref(storage, path);

  const snapshot = await uploadBytes(fileRef, file, {
    contentType: contentType || file.type,
  });

  return await getDownloadURL(snapshot.ref);
}
