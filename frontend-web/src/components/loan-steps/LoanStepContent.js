import React from 'react';
import ApplicationSubmittedStep from './ApplicationSubmittedStep';
import InitialReviewStep from './InitialReviewStep';
import DocumentVerificationStep from './DocumentVerificationStep';
import CreditCheckStep from './CreditCheckStep';
import FinalApprovalStep from './FinalApprovalStep';
import FundingStep from './FundingStep';

const LoanStepContent = ({ activeStep, loan, formatDate, formatCurrency, onUpdateStatus }) => {
    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return <ApplicationSubmittedStep loan={loan} formatDate={formatDate} />;
            case 1:
                return <InitialReviewStep />;
            case 2:
                return <DocumentVerificationStep />;
            case 3:
                return <CreditCheckStep loan={loan} />;
            case 4:
                return <FinalApprovalStep loan={loan} onUpdateStatus={onUpdateStatus} />;
            case 5:
                return <FundingStep loan={loan} formatCurrency={formatCurrency} />;
            default:
                return null;
        }
    };

    return renderStepContent();
};

export default LoanStepContent;
