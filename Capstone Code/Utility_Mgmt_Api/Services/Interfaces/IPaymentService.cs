using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Payment;

namespace UtilityManagmentApi.Services.Interfaces;

public interface IPaymentService
{
    Task<ApiResponse<PaymentDto>> GetByIdAsync(int id);
    Task<ApiResponse<PaymentDto>> GetByPaymentNumberAsync(string paymentNumber);
    Task<ApiResponse<List<PaymentDto>>> GetByBillIdAsync(int billId);
    Task<ApiResponse<List<PaymentDto>>> GetByConsumerIdAsync(int consumerId);
    Task<PagedResponse<PaymentListDto>> GetAllAsync(
        PaginationParams paginationParams,
        string? paymentMethod = null,
        DateTime? fromDate = null,
        DateTime? toDate = null
    );
    Task<ApiResponse<PaymentDto>> CreateAsync(CreatePaymentDto dto, int userId);
    Task<ApiResponse<PaymentDto>> UpdateStatusAsync(int id, UpdatePaymentStatusDto dto);
    Task<ApiResponse<PaymentSummaryDto>> GetSummaryAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null
    );
}
