using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Consumer;

namespace UtilityManagmentApi.Services.Interfaces;

public interface IConsumerService
{
    Task<ApiResponse<ConsumerDto>> GetByIdAsync(int id);
    Task<ApiResponse<ConsumerDto>> GetByConsumerNumberAsync(string consumerNumber);
    Task<ApiResponse<ConsumerDto>> GetByUserIdAsync(int userId);
    Task<PagedResponse<ConsumerListDto>> GetAllAsync(
        PaginationParams paginationParams,
        bool? isActive = null
    );
    Task<ApiResponse<ConsumerDto>> CreateAsync(CreateConsumerDto dto);
    Task<ApiResponse<ConsumerDto>> UpdateAsync(int id, UpdateConsumerDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
    Task<ApiResponse<List<ConsumerListDto>>> SearchAsync(string searchTerm);
}
