using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.TariffPlan;

namespace UtilityManagmentApi.Services.Interfaces;

public interface ITariffPlanService
{
    Task<ApiResponse<TariffPlanDto>> GetByIdAsync(int id);
    Task<ApiResponse<List<TariffPlanDto>>> GetAllAsync(
        bool? isActive = null,
        int? utilityTypeId = null
    );
    Task<PagedResponse<TariffPlanListDto>> GetPagedAsync(
        PaginationParams paginationParams,
        bool? isActive = null,
        int? utilityTypeId = null
    );
    Task<ApiResponse<TariffPlanDto>> CreateAsync(CreateTariffPlanDto dto);
    Task<ApiResponse<TariffPlanDto>> UpdateAsync(int id, UpdateTariffPlanDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
    Task<ApiResponse<List<TariffPlanListDto>>> GetByUtilityTypeAsync(int utilityTypeId);
}
