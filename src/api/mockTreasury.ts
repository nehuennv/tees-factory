export const updatePaymentStatus = async (
    _paymentId: string,
    _status: 'APPROVED' | 'REJECTED',
    _approvedAmount?: number
): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 600);
    });
};
