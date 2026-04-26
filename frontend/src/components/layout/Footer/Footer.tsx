import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <Box
            component="footer"
            sx={{
                borderTop: '1px solid #2d2f33',
                py: 2,
                mt: 'auto',
                textAlign: 'center',
            }}
        >
            <Typography variant="caption" sx={{ color: '#e0e0e0', opacity: 0.7 }}>
                © 2026 MARS |{' '}
                <MuiLink
                    component={Link}
                    to="/privacy"
                    sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                    Політика конфіденційності
                </MuiLink>{' '}
                |{' '}
                <MuiLink
                    component={Link}
                    to="/terms"
                    sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                    Умови користування
                </MuiLink>
            </Typography>
        </Box>
    );
};

export default Footer;
