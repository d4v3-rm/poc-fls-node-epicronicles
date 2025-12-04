const asset = (path: string) => {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');
  return `${base}/${rel}`;
};

export const MAIN_MENU_BACKGROUNDS = [
  asset('/pages/main-menu/backgrounds/main-menu-background-1.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-2.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-3.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-4.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-5.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-6.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-7.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-8.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-9.png'),
  asset('/pages/main-menu/backgrounds/main-menu-background-10.png'),
];

export const pickBackground = (index: number) =>
  MAIN_MENU_BACKGROUNDS[index % MAIN_MENU_BACKGROUNDS.length] ??
  MAIN_MENU_BACKGROUNDS[0];

export const randomBackgroundIndex = () =>
  Math.floor(Math.random() * MAIN_MENU_BACKGROUNDS.length);
