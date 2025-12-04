import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const FinalApprovalStep = ({ loan, onUpdateStatus }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Final Approval</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Final decision on the loan application based on all verification steps.
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>Decision Summary:</Typography>
                <Typography variant="body2">• All documents verified</Typography>
                <Typography variant="body2">• Credit check completed</Typography>
                <Typography variant="body2">• Applicant meets eligibility criteria</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => onUpdateStatus(loan.id, 'approved')}
                    >
                        Approve Application
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => onUpdateStatus(loan.id, 'rejected')}
                    >
                        Reject Application
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default FinalApprovalStep;
