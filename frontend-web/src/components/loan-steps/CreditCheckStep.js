import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

const CreditCheckStep = ({ loan }) => {
    const getCreditRating = (score) => {
        if (score >= 750) return 'Excellent';
        if (score >= 700) return 'Good';
        if (score >= 650) return 'Fair';
        return 'Poor';
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Credit Check</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Running credit history and score verification to assess creditworthiness.
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Credit Score</Typography>
                    <Typography variant="h6" color="primary">{loan.credit_score || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Credit Rating</Typography>
                    <Typography variant="h6" color="success.main">
                        {loan.credit_score ? getCreditRating(loan.credit_score) : 'N/A'}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CreditCheckStep;
