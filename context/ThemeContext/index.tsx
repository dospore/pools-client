import React, { useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { useStore } from '~/store/main';
import { selectSetTheme, selectTheme } from '~/store/ThemeSlice';
import { Theme, themes } from '~/store/ThemeSlice/themes';

export const StyledThemeProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
    const theme = useStore(selectTheme);
    const setTheme = useStore(selectSetTheme);

    // set theme
    useEffect(() => {
        if (localStorage.getItem('theme') === 'light') {
            setTheme(Theme.Light);
        }
    }, []);

    return <ThemeProvider theme={themes[theme]}>{children}</ThemeProvider>;
};
