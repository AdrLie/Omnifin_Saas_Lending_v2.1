import React from 'react';
import { Box, Typography } from '@mui/material';

const ApplicationSubmittedStep = ({ loan, formatDate }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Application Submitted</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                The loan application has been successfully submitted and is awaiting initial review.
            </Typography>
            <Typography variant="body2"><strong>Submitted on:</strong> {formatDate(loan.created_at)}</Typography>
            <Typography variant="body2"><strong>Application ID:</strong> #{loan.id || loan.application_number}</Typography>
        </Box>
    );
};

export default ApplicationSubmittedStep;
