const cleanBase = (base: string) => base.replace(/\/+$/, '') || '/';
const cleanPath = (p: string) => p.replace(/^\/+/, '');

export const getBasePath = () => cleanBase(import.meta.env.VITE_BASE_PATH || '/');

export const getAssetUrl = (path: string) => {
  const baseUrl = cleanBase(import.meta.env.BASE_URL || '/');
  return `${baseUrl}/${cleanPath(path)}`;
};
