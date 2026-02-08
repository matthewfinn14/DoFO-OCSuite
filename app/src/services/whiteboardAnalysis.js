/**
 * Client-side service for whiteboard analysis.
 * Handles image upload to Firebase Storage and calls the Cloud Function.
 */

import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { functions, storage } from './firebase';
import { compressImage } from './storage';

/**
 * Analyze a whiteboard image using the Cloud Function.
 *
 * @param {File} imageFile - The whiteboard image file
 * @param {string} schoolId - The school's ID for rate limiting
 * @returns {Promise<Object>} - Analysis result with normalized WIZ elements
 */
export async function analyzeWhiteboardImage(imageFile, schoolId) {
  if (!imageFile) {
    throw new Error('Image file is required');
  }
  if (!schoolId) {
    throw new Error('School ID is required');
  }

  // Generate a unique temporary path for the image
  const timestamp = Date.now();
  const tempPath = `schools/${schoolId}/whiteboard-temp/${timestamp}.jpg`;

  let downloadUrl;
  let uploaded = false;

  try {
    // Compress the image (larger max width for better AI analysis)
    const { blob: compressedBlob } = await compressImage(imageFile, 1600, 0.9);

    // Upload to temporary storage
    const imageRef = ref(storage, tempPath);
    await uploadBytes(imageRef, compressedBlob, {
      contentType: 'image/jpeg',
    });
    uploaded = true;

    // Get the download URL
    downloadUrl = await getDownloadURL(imageRef);

    // Call the Cloud Function
    const analyzeFunction = httpsCallable(functions, 'analyzeWhiteboard');
    const result = await analyzeFunction({
      imageUrl: downloadUrl,
      schoolId,
    });

    return result.data;
  } finally {
    // Clean up the temporary image
    if (uploaded) {
      try {
        const imageRef = ref(storage, tempPath);
        await deleteObject(imageRef);
      } catch (cleanupError) {
        // Ignore cleanup errors
        console.warn('Failed to clean up temp whiteboard image:', cleanupError);
      }
    }
  }
}

/**
 * Convert raw analysis result to WIZ diagram elements.
 * This prepares the elements for the PlayDiagramEditor.
 *
 * @param {Object} analysisData - The normalized data from the Cloud Function
 * @param {Object} positionColors - User's position color preferences
 * @returns {Array} - Array of WIZ diagram elements
 */
export function convertToWizElements(analysisData, positionColors = {}) {
  if (!analysisData || !analysisData.players) {
    return [];
  }

  const elements = [];
  const { players, routes } = analysisData;

  // Add player elements
  for (const player of players) {
    // Resolve color from position
    const color = positionColors[player.positionKey] ||
                  positionColors[player.label] ||
                  '#000000';

    elements.push({
      id: player.id,
      type: 'player',
      points: player.points,
      color,
      label: player.label,
      shape: player.shape,
      variant: player.variant,
      positionKey: player.positionKey,
      groupId: player.groupId,
    });
  }

  // Add route elements
  for (const route of routes) {
    elements.push({
      id: route.id,
      type: 'polyline',
      points: route.points,
      color: route.color,
      strokeWidth: route.strokeWidth || 3,
      style: route.style,
      endType: route.endType,
    });
  }

  return elements;
}

/**
 * Default position labels for skill positions.
 * Used in the position assignment step.
 */
export const SKILL_POSITION_OPTIONS = [
  { value: 'QB', label: 'QB - Quarterback' },
  { value: 'RB', label: 'RB - Running Back' },
  { value: 'FB', label: 'FB - Fullback' },
  { value: 'X', label: 'X - Split End' },
  { value: 'Y', label: 'Y - Tight End' },
  { value: 'Z', label: 'Z - Flanker' },
  { value: 'H', label: 'H - H-Back/Slot' },
  { value: 'A', label: 'A - A-Back' },
  { value: 'F', label: 'F - F-Back' },
];

/**
 * O-Line position labels.
 */
export const OLINE_POSITION_OPTIONS = [
  { value: 'LT', label: 'LT - Left Tackle' },
  { value: 'LG', label: 'LG - Left Guard' },
  { value: 'C', label: 'C - Center' },
  { value: 'RG', label: 'RG - Right Guard' },
  { value: 'RT', label: 'RT - Right Tackle' },
];

/**
 * Get image quality tips for users when analysis fails.
 */
export function getImageQualityTips() {
  return [
    'Use good lighting - avoid shadows on the whiteboard',
    'Take the photo straight-on, not at an angle',
    'Make sure the entire play is visible in the frame',
    'Use dark markers on a white background for best contrast',
    'Clean the whiteboard before drawing if it has ghosting',
    'Avoid glare from overhead lights or windows',
  ];
}
