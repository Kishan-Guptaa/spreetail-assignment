/**
 * Resolves a username or avatar URL to one of the 9 custom hand-drawn doodle avatars.
 */
export const getDoodleAvatar = (nameOrUrl: string = ''): string => {
  if (!nameOrUrl) return '/doodles/doodle_1.png';
  
  // If it's already pointing to a custom doodle path, return it directly
  if (nameOrUrl.includes('doodle_')) {
    return nameOrUrl;
  }
  
  // Otherwise, hash the string to consistently select one of the 9 doodles (1-9)
  let hash = 0;
  for (let i = 0; i < nameOrUrl.length; i++) {
    hash = nameOrUrl.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = (Math.abs(hash) % 9) + 1;
  return `/doodles/doodle_${index}.png`;
};
