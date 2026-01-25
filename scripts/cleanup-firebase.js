/**
 * Firebase Cleanup Script
 * Removes legacy/antiquated fields from all schools and users
 *
 * Run with: node scripts/cleanup-firebase.js
 *
 * Prerequisites:
 * 1. npm install firebase-admin
 * 2. Download service account key from Firebase Console > Project Settings > Service Accounts
 * 3. Save as scripts/serviceAccountKey.json
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Fields to DELETE from school documents
const SCHOOL_LEGACY_FIELDS = [
  // Legacy features removed from app
  'budget',
  'colors',
  'cultural_calibration',
  'dailyConnections',
  'depth_charts',              // Old format, replaced by depthChart
  'drills',
  'formationLayouts',
  'athleteAssessments',
  'inventory',
  'linkedAccessRequest',
  'onboarding',
  'positionFatigue',
  'program_records',
  'rooskiLib',
  'valhalla',
  'weightLogs',
  // All LastModified fields - just metadata cruft
  'budgetLastModified',
  'cultural_calibrationLastModified',
  'dailyConnectionsLastModified',
  'depth_chartsLastModified',
  'depthChartLastModified',
  'drillsLastModified',
  'formationLayoutsLastModified',
  'formationsLastModified',
  'inventoryLastModified',
  'onboardingLastModified',
  'playsLastModified',
  'positionFatigueLastModified',
  'positionNamesLastModified',
  'program_recordsLastModified',
  'ratingsLastModified',
  'rooskiLibLastModified',
  'rosterLastModified',
  'settingsLastModified',
  'staffLastModified',
  'valhallaLastModified',
  'wbSettingsLastModified',
  'wbSettingsV3LastModified',
  'weeksLastModified',
  'weightLogsLastModified',
  'wizLibLastModified',
  'billingLastModified',
  'attendanceLastModified',
];

// Fields to DELETE from user documents (school data that shouldn't be there)
// User docs should ONLY have: email, schoolId, memberships subcollection
const USER_LEGACY_FIELDS = [
  // Current app data (shouldn't be in user docs)
  'roster',
  'plays',
  'staff',
  'settings',
  'weeks',
  'attendance',
  'ratings',
  'formations',
  'depthChart',
  'positionNames',
  'wizLib',
  'wbSettings',
  'wbSettingsV3',
  'billing',
  'memberList',
  // Legacy features
  'budget',
  'colors',
  'cultural_calibration',
  'dailyConnections',
  'depth_charts',
  'drills',
  'formationLayouts',
  'athleteAssessments',
  'inventory',
  'onboarding',
  'positionFatigue',
  'program_records',
  'rooskiLib',
  'valhalla',
  'weightLogs',
  // All LastModified fields
  'budgetLastModified',
  'cultural_calibrationLastModified',
  'dailyConnectionsLastModified',
  'depth_chartsLastModified',
  'depthChartLastModified',
  'drillsLastModified',
  'formationLayoutsLastModified',
  'formationsLastModified',
  'inventoryLastModified',
  'onboardingLastModified',
  'playsLastModified',
  'positionFatigueLastModified',
  'positionNamesLastModified',
  'program_recordsLastModified',
  'ratingsLastModified',
  'rooskiLibLastModified',
  'rosterLastModified',
  'settingsLastModified',
  'staffLastModified',
  'valhallaLastModified',
  'wbSettingsLastModified',
  'wbSettingsV3LastModified',
  'weeksLastModified',
  'weightLogsLastModified',
  'wizLibLastModified',
  'billingLastModified',
  'attendanceLastModified',
];

async function cleanupSchools() {
  console.log('\n=== Cleaning up SCHOOLS ===\n');

  const schoolsSnapshot = await db.collection('schools').get();
  console.log(`Found ${schoolsSnapshot.size} schools`);

  for (const doc of schoolsSnapshot.docs) {
    const data = doc.data();
    const fieldsToDelete = {};

    for (const field of SCHOOL_LEGACY_FIELDS) {
      if (data.hasOwnProperty(field)) {
        fieldsToDelete[field] = admin.firestore.FieldValue.delete();
      }
    }

    if (Object.keys(fieldsToDelete).length > 0) {
      console.log(`  ${doc.id}: Deleting ${Object.keys(fieldsToDelete).length} legacy fields:`, Object.keys(fieldsToDelete));
      await db.collection('schools').doc(doc.id).update(fieldsToDelete);
    } else {
      console.log(`  ${doc.id}: No legacy fields found`);
    }
  }
}

async function cleanupUsers() {
  console.log('\n=== Cleaning up USERS ===\n');

  const usersSnapshot = await db.collection('users').get();
  console.log(`Found ${usersSnapshot.size} users`);

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const fieldsToDelete = {};

    for (const field of USER_LEGACY_FIELDS) {
      if (data.hasOwnProperty(field)) {
        fieldsToDelete[field] = admin.firestore.FieldValue.delete();
      }
    }

    if (Object.keys(fieldsToDelete).length > 0) {
      console.log(`  ${doc.id}: Deleting ${Object.keys(fieldsToDelete).length} legacy fields:`, Object.keys(fieldsToDelete));
      await db.collection('users').doc(doc.id).update(fieldsToDelete);
    } else {
      console.log(`  ${doc.id}: No legacy fields found`);
    }
  }
}

async function cleanupDuplicateMemberList() {
  console.log('\n=== Cleaning up duplicate memberList entries ===\n');

  const schoolsSnapshot = await db.collection('schools').get();

  for (const doc of schoolsSnapshot.docs) {
    const data = doc.data();
    const memberList = data.memberList || [];

    if (memberList.length <= 1) continue;

    // Dedupe by email
    const seen = new Set();
    const deduped = memberList.filter(m => {
      const email = (m.email || '').toLowerCase();
      if (seen.has(email)) return false;
      seen.add(email);
      return true;
    });

    if (deduped.length < memberList.length) {
      console.log(`  ${doc.id}: Removing ${memberList.length - deduped.length} duplicate memberList entries`);
      await db.collection('schools').doc(doc.id).update({ memberList: deduped });
    }
  }
}

async function main() {
  console.log('Firebase Cleanup Script');
  console.log('=======================\n');

  try {
    await cleanupSchools();
    await cleanupUsers();
    await cleanupDuplicateMemberList();

    console.log('\n=== CLEANUP COMPLETE ===\n');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }

  process.exit(0);
}

main();
