/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The generated slug
 */
export const generateSlug = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^\w\s-]/g, '')
    // Replace multiple spaces/hyphens with single hyphen
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate a unique slug for a menu item
 * @param {string} name - The menu item name
 * @param {string} category - The menu item category (optional)
 * @param {string} vendorId - The vendor ID (optional)
 * @returns {string} - The generated unique slug
 */
export const generateMenuItemSlug = (name, category = '', vendorId = '') => {
  const baseSlug = generateSlug(name);

  if (!baseSlug) {
    return 'menu-item';
  }

  // If vendorId is provided, append it to ensure uniqueness
  if (vendorId) {
    return `${baseSlug}-${vendorId}`;
  }

  return baseSlug;
};

/**
 * Ensure slug uniqueness by appending a number if needed
 * @param {string} baseSlug - The base slug
 * @param {Function} checkExists - Function to check if slug exists
 * @returns {Promise<string>} - The unique slug
 */
export const ensureUniqueSlug = async (baseSlug, checkExists) => {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};


