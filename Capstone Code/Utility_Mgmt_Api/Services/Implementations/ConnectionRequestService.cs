using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.ConnectionRequest;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class ConnectionRequestService : IConnectionRequestService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;

    public ConnectionRequestService(
        ApplicationDbContext context,
        INotificationService notificationService,
        UserManager<ApplicationUser> userManager
    )
    {
        _context = context;
        _notificationService = notificationService;
        _userManager = userManager;
    }

    public async Task<ApiResponse<ConnectionRequestDto>> CreateRequestAsync(
        int userId,
        CreateConnectionRequestDto dto
    )
    {
        // Get consumer from user
        var consumer = await _context
            .Consumers.Include(c => c.User)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (consumer == null)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse("Consumer not found");
        }

        // Validate utility type
        var utilityType = await _context.UtilityTypes.FindAsync(dto.UtilityTypeId);
        if (utilityType == null || !utilityType.IsActive)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse(
                "Utility type not found or not active"
            );
        }

        // Validate tariff plan
        var tariffPlan = await _context.TariffPlans.FindAsync(dto.TariffPlanId);
        if (tariffPlan == null || !tariffPlan.IsActive)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse(
                "Tariff plan not found or not active"
            );
        }

        if (tariffPlan.UtilityTypeId != dto.UtilityTypeId)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse(
                "Tariff plan does not match utility type"
            );
        }

        // Check if consumer already has an active connection for this utility type
        var existingConnection = await _context.Connections.AnyAsync(c =>
            c.ConsumerId == consumer.Id
            && c.UtilityTypeId == dto.UtilityTypeId
            && c.Status == ConnectionStatus.Active
        );

        if (existingConnection)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse(
                $"You already have an active {utilityType.Name} connection"
            );
        }

        // Check if consumer already has a pending request for this utility type
        var existingRequest = await _context.ConnectionRequests.AnyAsync(r =>
            r.ConsumerId == consumer.Id
            && r.UtilityTypeId == dto.UtilityTypeId
            && r.Status == ConnectionRequestStatus.Pending
        );

        if (existingRequest)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse(
                $"You already have a pending request for {utilityType.Name}"
            );
        }

        var requestNumber = await GenerateRequestNumberAsync();

        var request = new ConnectionRequest
        {
            ConsumerId = consumer.Id,
            UtilityTypeId = dto.UtilityTypeId,
            TariffPlanId = dto.TariffPlanId,
            RequestNumber = requestNumber,
            LoadSanctioned = dto.LoadSanctioned,
            InstallationAddress = dto.InstallationAddress ?? consumer.Address,
            Remarks = dto.Remarks,
            Status = ConnectionRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        _context.ConnectionRequests.Add(request);
        await _context.SaveChangesAsync();

        // Notify admins about new request
        await NotifyAdminsAboutNewRequestAsync(request, consumer, utilityType);

        // Load navigation properties
        request.Consumer = consumer;
        request.UtilityType = utilityType;
        request.TariffPlan = tariffPlan;

        return ApiResponse<ConnectionRequestDto>.SuccessResponse(
            MapToDto(request),
            $"Your request for {utilityType.Name} connection has been submitted successfully. You will be notified once it is processed."
        );
    }

    public async Task<ApiResponse<List<ConnectionRequestDto>>> GetMyRequestsAsync(int userId)
    {
        var consumer = await _context.Consumers.FirstOrDefaultAsync(c => c.UserId == userId);
        if (consumer == null)
        {
            return ApiResponse<List<ConnectionRequestDto>>.ErrorResponse("Consumer not found");
        }

        var requests = await _context
            .ConnectionRequests.Include(r => r.Consumer)
                .ThenInclude(c => c.User)
            .Include(r => r.UtilityType)
            .Include(r => r.TariffPlan)
            .Include(r => r.ProcessedByUser)
            .Include(r => r.CreatedConnection)
            .Where(r => r.ConsumerId == consumer.Id)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return ApiResponse<List<ConnectionRequestDto>>.SuccessResponse(
            requests.Select(MapToDto).ToList()
        );
    }

    public async Task<ApiResponse<ConnectionRequestDto>> GetRequestByIdAsync(int id)
    {
        var request = await _context
            .ConnectionRequests.Include(r => r.Consumer)
                .ThenInclude(c => c.User)
            .Include(r => r.UtilityType)
            .Include(r => r.TariffPlan)
            .Include(r => r.ProcessedByUser)
            .Include(r => r.CreatedConnection)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse("Connection request not found");
        }

        return ApiResponse<ConnectionRequestDto>.SuccessResponse(MapToDto(request));
    }

    public async Task<ApiResponse<bool>> CancelRequestAsync(int userId, int requestId)
    {
        var consumer = await _context.Consumers.FirstOrDefaultAsync(c => c.UserId == userId);
        if (consumer == null)
        {
            return ApiResponse<bool>.ErrorResponse("Consumer not found");
        }

        var request = await _context.ConnectionRequests.FirstOrDefaultAsync(r =>
            r.Id == requestId && r.ConsumerId == consumer.Id
        );

        if (request == null)
        {
            return ApiResponse<bool>.ErrorResponse("Connection request not found");
        }

        if (request.Status != ConnectionRequestStatus.Pending)
        {
            return ApiResponse<bool>.ErrorResponse("Only pending requests can be cancelled");
        }

        request.Status = ConnectionRequestStatus.Cancelled;
        request.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Connection request cancelled successfully");
    }

    public async Task<ApiResponse<List<AvailableUtilityDto>>> GetAvailableUtilitiesAsync(int userId)
    {
        var consumer = await _context.Consumers.FirstOrDefaultAsync(c => c.UserId == userId);
        if (consumer == null)
        {
            return ApiResponse<List<AvailableUtilityDto>>.ErrorResponse("Consumer not found");
        }

        // Get consumer's existing active connections and pending requests
        var existingUtilityIds = await _context
            .Connections.Where(c =>
                c.ConsumerId == consumer.Id && c.Status == ConnectionStatus.Active
            )
            .Select(c => c.UtilityTypeId)
            .ToListAsync();

        var pendingRequestUtilityIds = await _context
            .ConnectionRequests.Where(r =>
                r.ConsumerId == consumer.Id && r.Status == ConnectionRequestStatus.Pending
            )
            .Select(r => r.UtilityTypeId)
            .ToListAsync();

        var excludedUtilityIds = existingUtilityIds
            .Concat(pendingRequestUtilityIds)
            .Distinct()
            .ToList();

        // Get available utility types with their tariff plans
        var availableUtilities = await _context
            .UtilityTypes.Where(u => u.IsActive && !excludedUtilityIds.Contains(u.Id))
            .Include(u => u.TariffPlans.Where(t => t.IsActive))
            .Select(u => new AvailableUtilityDto
            {
                UtilityTypeId = u.Id,
                UtilityTypeName = u.Name,
                Description = u.Description,
                UnitOfMeasurement = u.UnitOfMeasurement,
                TariffPlans = u
                    .TariffPlans.Select(t => new AvailableTariffPlanDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        Description = t.Description,
                        RatePerUnit = t.RatePerUnit,
                        FixedCharges = t.FixedCharges,
                        TaxPercentage = t.TaxPercentage,
                    })
                    .ToList(),
            })
            .ToListAsync();

        return ApiResponse<List<AvailableUtilityDto>>.SuccessResponse(availableUtilities);
    }

    public async Task<PagedResponse<ConnectionRequestListDto>> GetAllRequestsAsync(
        PaginationParams paginationParams,
        string? status = null
    )
    {
        var query = _context
            .ConnectionRequests.Include(r => r.Consumer)
                .ThenInclude(c => c.User)
            .Include(r => r.UtilityType)
            .Include(r => r.TariffPlan)
            .AsQueryable();

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<ConnectionRequestStatus>(status, true, out var statusEnum)
        )
        {
            query = query.Where(r => r.Status == statusEnum);
        }

        if (!string.IsNullOrEmpty(paginationParams.SearchTerm))
        {
            var searchTerm = paginationParams.SearchTerm.ToLower();
            query = query.Where(r =>
                r.RequestNumber.ToLower().Contains(searchTerm)
                || r.Consumer.ConsumerNumber.ToLower().Contains(searchTerm)
                || r.Consumer.User.FirstName.ToLower().Contains(searchTerm)
                || r.Consumer.User.LastName.ToLower().Contains(searchTerm)
                || r.UtilityType.Name.ToLower().Contains(searchTerm)
            );
        }

        var totalRecords = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalRecords / (double)paginationParams.PageSize);

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .Select(r => new ConnectionRequestListDto
            {
                Id = r.Id,
                RequestNumber = r.RequestNumber,
                ConsumerName = $"{r.Consumer.User.FirstName} {r.Consumer.User.LastName}",
                ConsumerNumber = r.Consumer.ConsumerNumber,
                UtilityTypeName = r.UtilityType.Name,
                TariffPlanName = r.TariffPlan.Name,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt,
                ProcessedAt = r.ProcessedAt,
            })
            .ToListAsync();

        return new PagedResponse<ConnectionRequestListDto>
        {
            Data = requests,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize,
            TotalPages = totalPages,
            TotalRecords = totalRecords,
        };
    }

    public async Task<ApiResponse<ConnectionRequestDto>> ProcessRequestAsync(
        int requestId,
        int adminUserId,
        ProcessConnectionRequestDto dto
    )
    {
        var request = await _context
            .ConnectionRequests.Include(r => r.Consumer)
                .ThenInclude(c => c.User)
            .Include(r => r.UtilityType)
            .Include(r => r.TariffPlan)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse("Connection request not found");
        }

        if (request.Status != ConnectionRequestStatus.Pending)
        {
            return ApiResponse<ConnectionRequestDto>.ErrorResponse(
                "Only pending requests can be processed"
            );
        }

        request.ProcessedByUserId = adminUserId;
        request.ProcessedAt = DateTime.UtcNow;
        request.AdminRemarks = dto.AdminRemarks;
        request.UpdatedAt = DateTime.UtcNow;

        if (dto.Approve)
        {
            // Generate meter number if not provided
            var meterNumber =
                dto.MeterNumber ?? await GenerateMeterNumberAsync(request.UtilityTypeId);

            // Check if meter number already exists
            if (await _context.Connections.AnyAsync(c => c.MeterNumber == meterNumber))
            {
                return ApiResponse<ConnectionRequestDto>.ErrorResponse(
                    "Meter number already exists. Please provide a unique meter number."
                );
            }

            // Create the connection
            var connectionNumber = await GenerateConnectionNumberAsync(request.UtilityTypeId);

            var connection = new Connection
            {
                ConsumerId = request.ConsumerId,
                UtilityTypeId = request.UtilityTypeId,
                TariffPlanId = request.TariffPlanId,
                MeterNumber = meterNumber,
                ConnectionNumber = connectionNumber,
                ConnectionDate = DateTime.UtcNow,
                Status = ConnectionStatus.Active,
                LoadSanctioned = request.LoadSanctioned,
                InstallationAddress = request.InstallationAddress,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Connections.Add(connection);
            await _context.SaveChangesAsync();

            request.Status = ConnectionRequestStatus.Approved;
            request.CreatedConnectionId = connection.Id;
            request.CreatedConnection = connection;

            // Notify consumer about approval
            await _notificationService.CreateNotificationAsync(
                request.Consumer.UserId,
                "Connection Request Approved",
                $"Your request for {request.UtilityType.Name} connection has been approved. "
                    + $"Connection Number: {connectionNumber}, Meter Number: {meterNumber}",
                NotificationType.ConnectionStatusChange,
                connection.Id,
                "Connection"
            );
        }
        else
        {
            request.Status = ConnectionRequestStatus.Rejected;

            // Notify consumer about rejection
            await _notificationService.CreateNotificationAsync(
                request.Consumer.UserId,
                "Connection Request Rejected",
                $"Your request for {request.UtilityType.Name} connection has been rejected. "
                    + $"Reason: {dto.AdminRemarks ?? "No reason provided"}",
                NotificationType.ConnectionStatusChange,
                request.Id,
                "ConnectionRequest"
            );
        }

        await _context.SaveChangesAsync();

        // Reload with navigation properties
        var processedByUser = await _userManager.FindByIdAsync(adminUserId.ToString());
        request.ProcessedByUser = processedByUser;

        return ApiResponse<ConnectionRequestDto>.SuccessResponse(
            MapToDto(request),
            dto.Approve
                ? "Request approved and connection created successfully"
                : "Request rejected successfully"
        );
    }

    public async Task<ApiResponse<List<ConnectionRequestListDto>>> GetPendingRequestsAsync()
    {
        var pendingRequests = await _context
            .ConnectionRequests.Include(r => r.Consumer)
                .ThenInclude(c => c.User)
            .Include(r => r.UtilityType)
            .Include(r => r.TariffPlan)
            .Where(r => r.Status == ConnectionRequestStatus.Pending)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new ConnectionRequestListDto
            {
                Id = r.Id,
                RequestNumber = r.RequestNumber,
                ConsumerName = $"{r.Consumer.User.FirstName} {r.Consumer.User.LastName}",
                ConsumerNumber = r.Consumer.ConsumerNumber,
                UtilityTypeName = r.UtilityType.Name,
                TariffPlanName = r.TariffPlan.Name,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt,
                ProcessedAt = r.ProcessedAt,
            })
            .ToListAsync();

        return ApiResponse<List<ConnectionRequestListDto>>.SuccessResponse(pendingRequests);
    }

    private async Task<string> GenerateRequestNumberAsync()
    {
        var year = DateTime.UtcNow.Year.ToString()[2..];
        var prefix = $"REQ{year}";

        var lastRequest = await _context
            .ConnectionRequests.Where(r => r.RequestNumber.StartsWith(prefix))
            .OrderByDescending(r => r.RequestNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastRequest != null)
        {
            var lastNumber = lastRequest.RequestNumber[prefix.Length..];
            if (int.TryParse(lastNumber, out int num))
            {
                nextNumber = num + 1;
            }
        }

        return $"{prefix}{nextNumber:D6}";
    }

    private async Task<string> GenerateMeterNumberAsync(int utilityTypeId)
    {
        var utilityType = await _context.UtilityTypes.FindAsync(utilityTypeId);
        var prefix = utilityType?.Name.Substring(0, 3).ToUpper() ?? "MTR";

        var lastConnection = await _context
            .Connections.Where(c => c.MeterNumber.StartsWith($"{prefix}-M"))
            .OrderByDescending(c => c.MeterNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastConnection != null)
        {
            var parts = lastConnection.MeterNumber.Split("-M");
            if (parts.Length > 1 && int.TryParse(parts[1], out int num))
            {
                nextNumber = num + 1;
            }
        }

        return $"{prefix}-M{nextNumber:D3}";
    }

    private async Task<string> GenerateConnectionNumberAsync(int utilityTypeId)
    {
        var utilityType = await _context.UtilityTypes.FindAsync(utilityTypeId);
        var prefix = utilityType?.Name.Substring(0, 3).ToUpper() ?? "CON";
        var year = DateTime.UtcNow.Year.ToString()[2..];

        var lastConnection = await _context
            .Connections.Where(c => c.ConnectionNumber.StartsWith($"{prefix}{year}"))
            .OrderByDescending(c => c.ConnectionNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastConnection != null)
        {
            var lastNumber = lastConnection.ConnectionNumber[(prefix.Length + 2)..];
            if (int.TryParse(lastNumber, out int num))
            {
                nextNumber = num + 1;
            }
        }

        return $"{prefix}{year}{nextNumber:D6}";
    }

    private async Task NotifyAdminsAboutNewRequestAsync(
        ConnectionRequest request,
        Consumer consumer,
        UtilityType utilityType
    )
    {
        // Get users in Admin role using UserManager
        var adminUsers = await _userManager.GetUsersInRoleAsync(UserRoles.Admin);
        var activeAdmins = adminUsers.Where(u => u.IsActive).ToList();

        foreach (var admin in activeAdmins)
        {
            await _notificationService.CreateNotificationAsync(
                admin.Id,
                "New Connection Request",
                $"New {utilityType.Name} connection request from {consumer.User.FirstName} {consumer.User.LastName} "
                    + $"(Consumer: {consumer.ConsumerNumber}). Request Number: {request.RequestNumber}",
                NotificationType.General,
                request.Id,
                "ConnectionRequest"
            );
        }
    }

    private static ConnectionRequestDto MapToDto(ConnectionRequest request)
    {
        return new ConnectionRequestDto
        {
            Id = request.Id,
            RequestNumber = request.RequestNumber,
            ConsumerId = request.ConsumerId,
            ConsumerName = $"{request.Consumer.User.FirstName} {request.Consumer.User.LastName}",
            ConsumerNumber = request.Consumer.ConsumerNumber,
            UtilityTypeId = request.UtilityTypeId,
            UtilityTypeName = request.UtilityType.Name,
            TariffPlanId = request.TariffPlanId,
            TariffPlanName = request.TariffPlan.Name,
            LoadSanctioned = request.LoadSanctioned,
            InstallationAddress = request.InstallationAddress,
            Remarks = request.Remarks,
            Status = request.Status.ToString(),
            AdminRemarks = request.AdminRemarks,
            ProcessedByUserName =
                request.ProcessedByUser != null
                    ? $"{request.ProcessedByUser.FirstName} {request.ProcessedByUser.LastName}"
                    : null,
            ProcessedAt = request.ProcessedAt,
            CreatedConnectionId = request.CreatedConnectionId,
            CreatedConnectionNumber = request.CreatedConnection?.ConnectionNumber,
            CreatedAt = request.CreatedAt,
        };
    }
}
