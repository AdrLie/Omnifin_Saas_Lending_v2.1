import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const DocumentVerificationStep = () => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Document Verification</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Verifying submitted documents including identity proof, income statements, and other required documentation.
            </Typography>
            <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>Required Documents:</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    <Chip label="ID Verification - Pending" color="warning" size="small" sx={{ width: 'fit-content' }} />
                    <Chip label="Income Proof - Pending" color="warning" size="small" sx={{ width: 'fit-content' }} />
                    <Chip label="Address Proof - Pending" color="warning" size="small" sx={{ width: 'fit-content' }} />
                </Box>
            </Box>
        </Box>
    );
};

export default DocumentVerificationStep;
