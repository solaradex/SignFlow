import React, { createContext, useContext } from 'react';
import { Theme, lightTheme } from './theme';

export const ThemeContext = createContext<Theme>(lightTheme);
export const useTheme = () => useContext(ThemeContext);
