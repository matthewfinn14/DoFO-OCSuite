import { useMemo } from 'react';

/**
 * Subscription status constants
 */
export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended'
};

/**
 * Hook to compute subscription status from school data
 * @param {Object} school - The school document with subscription field
 * @returns {Object} Subscription status info
 */
export function useSubscriptionStatus(school) {
  return useMemo(() => {
    // No school = no subscription info
    if (!school) {
      return {
        status: null,
        isActive: false,
        isExpired: false,
        isSuspended: false,
        isTrial: false,
        daysRemaining: null,
        trialEndDate: null,
        canAccess: false,
        statusLabel: 'Unknown',
        statusColor: 'slate'
      };
    }

    const subscription = school.subscription || {};
    const status = subscription.status || SUBSCRIPTION_STATUS.TRIAL;

    // Parse trial end date
    let trialEndDate = null;
    if (subscription.trialEndDate) {
      // Handle Firestore Timestamp or ISO string
      if (subscription.trialEndDate.toDate) {
        trialEndDate = subscription.trialEndDate.toDate();
      } else if (typeof subscription.trialEndDate === 'string') {
        trialEndDate = new Date(subscription.trialEndDate);
      } else if (subscription.trialEndDate instanceof Date) {
        trialEndDate = subscription.trialEndDate;
      }
    }

    const now = new Date();

    // Calculate days remaining for trial
    let daysRemaining = null;
    if (trialEndDate) {
      const msRemaining = trialEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    }

    // Determine if trial has expired (even if status wasn't updated)
    const trialExpired = status === SUBSCRIPTION_STATUS.TRIAL &&
      trialEndDate &&
      trialEndDate < now;

    // Compute boolean flags
    const isSuspended = status === SUBSCRIPTION_STATUS.SUSPENDED;
    const isExpired = status === SUBSCRIPTION_STATUS.EXPIRED || trialExpired;
    const isTrial = status === SUBSCRIPTION_STATUS.TRIAL && !trialExpired;
    const isActive = status === SUBSCRIPTION_STATUS.ACTIVE ||
      (status === SUBSCRIPTION_STATUS.TRIAL && !trialExpired);

    // Can user access the app?
    const canAccess = isActive && !isSuspended;

    // Status display info
    let statusLabel = 'Unknown';
    let statusColor = 'slate';

    if (isSuspended) {
      statusLabel = 'Suspended';
      statusColor = 'amber';
    } else if (isExpired) {
      statusLabel = 'Expired';
      statusColor = 'red';
    } else if (isTrial) {
      statusLabel = daysRemaining !== null ? `Trial (${daysRemaining} days)` : 'Trial';
      statusColor = 'sky';
    } else if (status === SUBSCRIPTION_STATUS.ACTIVE) {
      statusLabel = 'Active';
      statusColor = 'green';
    }

    return {
      status,
      isActive,
      isExpired,
      isSuspended,
      isTrial,
      daysRemaining,
      trialEndDate,
      canAccess,
      statusLabel,
      statusColor
    };
  }, [school]);
}

/**
 * Get subscription status info without React hook (for use in non-component code)
 * @param {Object} school - The school document
 * @returns {Object} Subscription status info
 */
export function getSubscriptionStatus(school) {
  if (!school) {
    return {
      status: null,
      isActive: false,
      isExpired: false,
      isSuspended: false,
      isTrial: false,
      daysRemaining: null,
      trialEndDate: null,
      canAccess: false,
      statusLabel: 'Unknown',
      statusColor: 'slate'
    };
  }

  const subscription = school.subscription || {};
  const status = subscription.status || SUBSCRIPTION_STATUS.TRIAL;

  let trialEndDate = null;
  if (subscription.trialEndDate) {
    if (subscription.trialEndDate.toDate) {
      trialEndDate = subscription.trialEndDate.toDate();
    } else if (typeof subscription.trialEndDate === 'string') {
      trialEndDate = new Date(subscription.trialEndDate);
    } else if (subscription.trialEndDate instanceof Date) {
      trialEndDate = subscription.trialEndDate;
    }
  }

  const now = new Date();

  let daysRemaining = null;
  if (trialEndDate) {
    const msRemaining = trialEndDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  }

  const trialExpired = status === SUBSCRIPTION_STATUS.TRIAL &&
    trialEndDate &&
    trialEndDate < now;

  const isSuspended = status === SUBSCRIPTION_STATUS.SUSPENDED;
  const isExpired = status === SUBSCRIPTION_STATUS.EXPIRED || trialExpired;
  const isTrial = status === SUBSCRIPTION_STATUS.TRIAL && !trialExpired;
  const isActive = status === SUBSCRIPTION_STATUS.ACTIVE ||
    (status === SUBSCRIPTION_STATUS.TRIAL && !trialExpired);

  const canAccess = isActive && !isSuspended;

  let statusLabel = 'Unknown';
  let statusColor = 'slate';

  if (isSuspended) {
    statusLabel = 'Suspended';
    statusColor = 'amber';
  } else if (isExpired) {
    statusLabel = 'Expired';
    statusColor = 'red';
  } else if (isTrial) {
    statusLabel = daysRemaining !== null ? `Trial (${daysRemaining} days)` : 'Trial';
    statusColor = 'sky';
  } else if (status === SUBSCRIPTION_STATUS.ACTIVE) {
    statusLabel = 'Active';
    statusColor = 'green';
  }

  return {
    status,
    isActive,
    isExpired,
    isSuspended,
    isTrial,
    daysRemaining,
    trialEndDate,
    canAccess,
    statusLabel,
    statusColor
  };
}

/**
 * Calculate trial end date from a start date and duration
 * @param {Date} startDate - When the trial starts
 * @param {number} days - Trial duration in days
 * @returns {Date} Trial end date
 */
export function calculateTrialEndDate(startDate, days) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  return endDate;
}

export default useSubscriptionStatus;
