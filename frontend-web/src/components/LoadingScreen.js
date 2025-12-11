import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';

const LoadingScreen = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography variant="body1">Loading...</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoadingScreen;
