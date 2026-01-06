using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.MeterReading;

namespace UtilityManagmentApi.Services.Interfaces;

public interface IMeterReadingService
{
    Task<ApiResponse<MeterReadingDto>> GetByIdAsync(int id);
    Task<ApiResponse<List<MeterReadingDto>>> GetByConnectionIdAsync(int connectionId);
    Task<PagedResponse<MeterReadingListDto>> GetAllAsync(
        PaginationParams paginationParams,
        int? billingMonth = null,
        int? billingYear = null
    );
    Task<ApiResponse<MeterReadingDto>> CreateAsync(CreateMeterReadingDto dto, int userId);
    Task<ApiResponse<List<MeterReadingDto>>> CreateBulkAsync(BulkMeterReadingDto dto, int userId);
    Task<ApiResponse<MeterReadingDto>> UpdateAsync(int id, UpdateMeterReadingDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
    Task<ApiResponse<List<MeterReadingListDto>>> GetUnbilledReadingsAsync(
        int? billingMonth = null,
        int? billingYear = null
    );
    Task<ApiResponse<decimal>> GetLastReadingAsync(int connectionId);
}
