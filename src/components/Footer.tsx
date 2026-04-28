import { Box, Link, Typography } from '@mui/material';

const Footer = () => (
  <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Made in Poland with ❤️ ·{' '}
      <Link
        href="https://github.com/tdi/cost-slicer/issues"
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
      >
        Suggestions & issues
      </Link>
    </Typography>
  </Box>
);

export default Footer;
