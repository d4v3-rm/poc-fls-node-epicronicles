import type { RootState } from '../index';

export const selectSession = (state: RootState) => state.game.session;
export const selectConfig = (state: RootState) => state.game.config;
export const selectView = (state: RootState) => state.game.view;
