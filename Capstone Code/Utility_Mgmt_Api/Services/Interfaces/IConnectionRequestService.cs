using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.ConnectionRequest;

namespace UtilityManagmentApi.Services.Interfaces;

public interface IConnectionRequestService
{
    // Consumer endpoints
    Task<ApiResponse<ConnectionRequestDto>> CreateRequestAsync(
        int userId,
        CreateConnectionRequestDto dto
    );
    Task<ApiResponse<List<ConnectionRequestDto>>> GetMyRequestsAsync(int userId);
    Task<ApiResponse<ConnectionRequestDto>> GetRequestByIdAsync(int id);
    Task<ApiResponse<bool>> CancelRequestAsync(int userId, int requestId);
    Task<ApiResponse<List<AvailableUtilityDto>>> GetAvailableUtilitiesAsync(int userId);

    // Admin endpoints
    Task<PagedResponse<ConnectionRequestListDto>> GetAllRequestsAsync(
        PaginationParams paginationParams,
        string? status = null
    );
    Task<ApiResponse<ConnectionRequestDto>> ProcessRequestAsync(
        int requestId,
        int adminUserId,
        ProcessConnectionRequestDto dto
    );
    Task<ApiResponse<List<ConnectionRequestListDto>>> GetPendingRequestsAsync();
}
