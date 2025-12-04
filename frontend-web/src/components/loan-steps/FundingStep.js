import React from 'react';
import { Box, Typography } from '@mui/material';

const FundingStep = ({ loan, formatCurrency }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Funding</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Application approved! Processing fund disbursement to the applicant's account.
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1, border: 1, borderColor: 'success.main' }}>
                <Typography variant="body2" fontWeight="medium" color="success.main">
                    ✓ Loan Amount: {formatCurrency(loan.loan_amount || loan.amount || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Funds will be disbursed within 2-3 business days.
                </Typography>
            </Box>
        </Box>
    );
};

export default FundingStep;
