import { createTheme, Shadows } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0d0f12',
            paper: '#15171a',
        },
        primary: {
            main: '#7ed321',
        },
        text: {
            primary: '#e0e0e0',
        },
        divider: '#2d2f33',
    },
    typography: {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 13,
    },
    shape: {
        borderRadius: 0,
    },
    shadows: Array(25).fill('none') as Shadows,
    components: {
        MuiButton: {
            defaultProps: {
                variant: 'outlined',
            },
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    '&:hover': {
                        backgroundColor: '#7ed321',
                        color: '#0d0f12',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                },
                label: {
                    display: 'flex',
                    alignItems: 'center',
                    '&::before': {
                        content: '"[ "',
                        marginRight: '4px',
                        opacity: 0.7,
                    },
                    '&::after': {
                        content: '" ]"',
                        marginLeft: '4px',
                        opacity: 0.7,
                    },
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'filled',
            },
        },
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid transparent',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    },
                    '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid #7ed321',
                    },
                    '&::before': {
                        display: 'none',
                    },
                    '&::after': {
                        display: 'none',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid #2d2f33',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                    border: '1px solid #2d2f33',
                },
            },
        },
    },
});
