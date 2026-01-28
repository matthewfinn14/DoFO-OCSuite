/**
 * Format wristband slot with type suffix
 * @param {number|string} slot - The wristband slot number
 * @param {string} type - The wristband type: 'standard', 'wiz', or 'mini'
 * @param {string} column - For mini-scripts, the column: 'A' or 'B'
 * @returns {string} Formatted slot (e.g., "101", "201W", "301A")
 */
export function formatWristbandSlot(slot, type, column) {
  if (!slot) return '';

  let suffix = '';
  if (type === 'wiz') {
    suffix = 'W';
  } else if (type === 'mini' && column) {
    suffix = column; // 'A' or 'B'
  } else if (type === 'mini') {
    suffix = 'M'; // Generic mini if no column specified
  }

  return `${slot}${suffix}`;
}

/**
 * Check if a play has a wristband assignment
 * @param {object} play - The play object
 * @returns {boolean}
 */
export function hasWristbandSlot(play) {
  return !!(play?.wristbandSlot);
}

/**
 * Get wristband display for a play (slot + type suffix)
 * @param {object} play - The play object
 * @returns {string} Formatted wristband slot or empty string
 */
export function getWristbandDisplay(play) {
  if (!play?.wristbandSlot) return '';
  return formatWristbandSlot(play.wristbandSlot, play.wristbandType, play.wristbandColumn);
}
