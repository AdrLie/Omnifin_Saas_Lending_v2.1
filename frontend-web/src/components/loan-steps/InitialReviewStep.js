import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

const InitialReviewStep = () => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Initial Review</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Our team is conducting an initial review of the application to verify basic information and eligibility.
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add review notes..."
                sx={{ mt: 2, bgcolor: 'white' }}
            />
        </Box>
    );
};

export default InitialReviewStep;
