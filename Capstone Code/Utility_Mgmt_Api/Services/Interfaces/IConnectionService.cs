using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Connection;

namespace UtilityManagmentApi.Services.Interfaces;

public interface IConnectionService
{
    Task<ApiResponse<ConnectionDto>> GetByIdAsync(int id);
    Task<ApiResponse<ConnectionDto>> GetByConnectionNumberAsync(string connectionNumber);
    Task<ApiResponse<List<ConnectionDto>>> GetByConsumerIdAsync(int consumerId);
    Task<PagedResponse<ConnectionListDto>> GetAllAsync(PaginationParams paginationParams, int? utilityTypeId = null, string? status = null);
    Task<ApiResponse<ConnectionDto>> CreateAsync(CreateConnectionDto dto);
    Task<ApiResponse<ConnectionDto>> UpdateAsync(int id, UpdateConnectionDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
    Task<ApiResponse<List<ConnectionListDto>>> GetPendingReadingsAsync(int billingMonth, int billingYear);
}
