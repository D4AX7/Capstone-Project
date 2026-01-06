using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.UtilityType;

namespace UtilityManagmentApi.Services.Interfaces;

public interface IUtilityTypeService
{
    Task<ApiResponse<UtilityTypeDto>> GetByIdAsync(int id);
    Task<ApiResponse<List<UtilityTypeDto>>> GetAllAsync(bool? isActive = null);
    Task<ApiResponse<UtilityTypeDto>> CreateAsync(CreateUtilityTypeDto dto);
    Task<ApiResponse<UtilityTypeDto>> UpdateAsync(int id, UpdateUtilityTypeDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
