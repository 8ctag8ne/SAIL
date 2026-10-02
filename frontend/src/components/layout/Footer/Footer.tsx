import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import { useFeedbackModal } from '../../../contexts/FeedbackContext';

const Footer: React.FC = () => {
    const { openFeedbackModal } = useFeedbackModal();

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
                </MuiLink>{' '}
                |{' '}
                <MuiLink
                    component="button"
                    onClick={() => openFeedbackModal()}
                    sx={{
                        color: 'inherit',
                        textDecoration: 'none',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        verticalAlign: 'baseline',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        p: 0,
                        '&:hover': { textDecoration: 'underline' }
                    }}
                >
                    Зворотний зв'язок
                </MuiLink>
            </Typography>
        </Box>
    );
};

export default Footer;
