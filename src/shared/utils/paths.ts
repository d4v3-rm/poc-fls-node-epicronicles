const normalizeSlashes = (value: string) => value.replace(/\/+/g, "/");
const stripTrailing = (value: string) => value === "/" ? "/" : value.replace(/\/+$/, "");
const stripLeading = (value: string) => value.replace(/^\/+/, "");

const cleanBase = (base: string) => {
  const normalized = normalizeSlashes(base || "/");
  return stripTrailing(normalized || "/");
};

export const getBasePath = () => {
  return cleanBase(import.meta.env.VITE_BASE_PATH || "/");
};

export const getAssetUrl = (path: string) => {
  const base = cleanBase(import.meta.env.BASE_URL || "/");
  const cleanedPath = stripLeading(normalizeSlashes(path || ""));
  return cleanedPath ? `${base}/${cleanedPath}` : base;
};
