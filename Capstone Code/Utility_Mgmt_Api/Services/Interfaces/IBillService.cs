using UtilityManagmentApi.DTOs.Bill;
using UtilityManagmentApi.DTOs.Common;

namespace UtilityManagmentApi.Services.Interfaces;

public interface IBillService
{
    Task<ApiResponse<BillDto>> GetByIdAsync(int id);
    Task<ApiResponse<BillDto>> GetByBillNumberAsync(string billNumber);
    Task<ApiResponse<List<BillDto>>> GetByConnectionIdAsync(int connectionId);
    Task<ApiResponse<List<BillDto>>> GetByConsumerIdAsync(int consumerId);
    Task<PagedResponse<BillListDto>> GetAllAsync(
        PaginationParams paginationParams,
        string? status = null,
        int? billingMonth = null,
        int? billingYear = null
    );
    Task<ApiResponse<BillDto>> GenerateBillAsync(GenerateBillDto dto, int userId);
    Task<ApiResponse<List<BillDto>>> GenerateBulkBillsAsync(GenerateBulkBillsDto dto, int userId);
    Task<ApiResponse<BillDto>> UpdateStatusAsync(int id, UpdateBillStatusDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
    Task<ApiResponse<BillSummaryDto>> GetSummaryAsync(
        int? billingMonth = null,
        int? billingYear = null
    );
    Task<ApiResponse<List<BillListDto>>> GetOverdueBillsAsync();
    Task UpdateOverdueBillsAsync();
}
