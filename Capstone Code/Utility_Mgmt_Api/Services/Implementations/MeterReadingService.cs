using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.MeterReading;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class MeterReadingService : IMeterReadingService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public MeterReadingService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager
    )
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<ApiResponse<MeterReadingDto>> GetByIdAsync(int id)
    {
        var reading = await _context
            .MeterReadings.Include(m => m.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(m => m.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(m => m.ReadByUser)
            .Include(m => m.Bill)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (reading == null)
        {
            return ApiResponse<MeterReadingDto>.ErrorResponse("Meter reading not found");
        }

        return ApiResponse<MeterReadingDto>.SuccessResponse(MapToDto(reading));
    }

    public async Task<ApiResponse<List<MeterReadingDto>>> GetByConnectionIdAsync(int connectionId)
    {
        var readings = await _context
            .MeterReadings.Include(m => m.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(m => m.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(m => m.ReadByUser)
            .Include(m => m.Bill)
            .Where(m => m.ConnectionId == connectionId)
            .OrderByDescending(m => m.BillingYear)
            .ThenByDescending(m => m.BillingMonth)
            .ToListAsync();

        return ApiResponse<List<MeterReadingDto>>.SuccessResponse(
            readings.Select(MapToDto).ToList()
        );
    }

    public async Task<PagedResponse<MeterReadingListDto>> GetAllAsync(
        PaginationParams paginationParams,
        int? billingMonth = null,
        int? billingYear = null
    )
    {
        var query = _context
            .MeterReadings.Include(m => m.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(m => m.Bill)
            .AsQueryable();

        if (billingMonth.HasValue)
        {
            query = query.Where(m => m.BillingMonth == billingMonth.Value);
        }

        if (billingYear.HasValue)
        {
            query = query.Where(m => m.BillingYear == billingYear.Value);
        }

        if (!string.IsNullOrEmpty(paginationParams.SearchTerm))
        {
            var searchTerm = paginationParams.SearchTerm.ToLower();
            query = query.Where(m =>
                m.Connection.ConnectionNumber.ToLower().Contains(searchTerm)
                || m.Connection.MeterNumber.ToLower().Contains(searchTerm)
                || m.Connection.Consumer.ConsumerNumber.ToLower().Contains(searchTerm)
            );
        }

        var totalRecords = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalRecords / (double)paginationParams.PageSize);

        var readings = await query
            .OrderByDescending(m => m.BillingYear)
            .ThenByDescending(m => m.BillingMonth)
            .ThenByDescending(m => m.ReadingDate)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .Select(m => new MeterReadingListDto
            {
                Id = m.Id,
                ConnectionNumber = m.Connection.ConnectionNumber,
                MeterNumber = m.Connection.MeterNumber,
                ConsumerName =
                    $"{m.Connection.Consumer.User.FirstName} {m.Connection.Consumer.User.LastName}",
                PreviousReading = m.PreviousReading,
                CurrentReading = m.CurrentReading,
                UnitsConsumed = m.UnitsConsumed,
                ReadingDate = m.ReadingDate,
                BillingMonth = m.BillingMonth,
                BillingYear = m.BillingYear,
                IsBilled = m.Bill != null,
                Status = m.Bill != null ? "Generated" : "Pending",
            })
            .ToListAsync();

        return new PagedResponse<MeterReadingListDto>
        {
            Data = readings,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize,
            TotalPages = totalPages,
            TotalRecords = totalRecords,
        };
    }

    public async Task<ApiResponse<MeterReadingDto>> CreateAsync(
        CreateMeterReadingDto dto,
        int userId
    )
    {
        var connection = await _context
            .Connections.Include(c => c.Consumer)
                .ThenInclude(co => co.User)
            .Include(c => c.UtilityType)
            .FirstOrDefaultAsync(c => c.Id == dto.ConnectionId);

        if (connection == null)
        {
            return ApiResponse<MeterReadingDto>.ErrorResponse("Connection not found");
        }

        if (connection.Status != ConnectionStatus.Active)
        {
            return ApiResponse<MeterReadingDto>.ErrorResponse("Connection is not active");
        }

        // Check if reading already exists for this period
        if (
            await _context.MeterReadings.AnyAsync(m =>
                m.ConnectionId == dto.ConnectionId
                && m.BillingMonth == dto.BillingMonth
                && m.BillingYear == dto.BillingYear
            )
        )
        {
            return ApiResponse<MeterReadingDto>.ErrorResponse(
                "Reading already exists for this billing period"
            );
        }

        // Get previous reading
        var previousReading = await GetLastReadingValueAsync(dto.ConnectionId);

        if (dto.CurrentReading < previousReading)
        {
            return ApiResponse<MeterReadingDto>.ErrorResponse(
                $"Current reading ({dto.CurrentReading}) cannot be less than previous reading ({previousReading})"
            );
        }

        var unitsConsumed = dto.CurrentReading - previousReading;

        var reading = new MeterReading
        {
            ConnectionId = dto.ConnectionId,
            PreviousReading = previousReading,
            CurrentReading = dto.CurrentReading,
            UnitsConsumed = unitsConsumed,
            ReadingDate = dto.ReadingDate ?? DateTime.UtcNow,
            BillingMonth = dto.BillingMonth,
            BillingYear = dto.BillingYear,
            ReadByUserId = userId,
            Notes = dto.Notes,
            IsEstimated = dto.IsEstimated,
            CreatedAt = DateTime.UtcNow,
        };

        _context.MeterReadings.Add(reading);
        await _context.SaveChangesAsync();

        reading.Connection = connection;
        reading.ReadByUser = await _userManager.FindByIdAsync(userId.ToString());

        return ApiResponse<MeterReadingDto>.SuccessResponse(
            MapToDto(reading),
            "Meter reading created successfully"
        );
    }

    public async Task<ApiResponse<List<MeterReadingDto>>> CreateBulkAsync(
        BulkMeterReadingDto dto,
        int userId
    )
    {
        var createdReadings = new List<MeterReadingDto>();
        var errors = new List<string>();

        foreach (var readingDto in dto.Readings)
        {
            var result = await CreateAsync(readingDto, userId);
            if (result.Success && result.Data != null)
            {
                createdReadings.Add(result.Data);
            }
            else
            {
                errors.Add($"Connection {readingDto.ConnectionId}: {result.Message}");
            }
        }

        if (errors.Any())
        {
            return ApiResponse<List<MeterReadingDto>>.ErrorResponse(
                $"Created {createdReadings.Count} readings with {errors.Count} errors",
                errors
            );
        }

        return ApiResponse<List<MeterReadingDto>>.SuccessResponse(
            createdReadings,
            $"Created {createdReadings.Count} readings successfully"
        );
    }

    public async Task<ApiResponse<MeterReadingDto>> UpdateAsync(int id, UpdateMeterReadingDto dto)
    {
        var reading = await _context
            .MeterReadings.Include(m => m.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(m => m.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(m => m.ReadByUser)
            .Include(m => m.Bill)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (reading == null)
        {
            return ApiResponse<MeterReadingDto>.ErrorResponse("Meter reading not found");
        }

        if (reading.Bill != null)
        {
            return ApiResponse<MeterReadingDto>.ErrorResponse(
                "Cannot update reading that has already been billed"
            );
        }

        if (dto.CurrentReading.HasValue)
        {
            if (dto.CurrentReading.Value < reading.PreviousReading)
            {
                return ApiResponse<MeterReadingDto>.ErrorResponse(
                    $"Current reading cannot be less than previous reading ({reading.PreviousReading})"
                );
            }
            reading.CurrentReading = dto.CurrentReading.Value;
            reading.UnitsConsumed = dto.CurrentReading.Value - reading.PreviousReading;
        }

        if (dto.ReadingDate.HasValue)
            reading.ReadingDate = dto.ReadingDate.Value;

        if (dto.BillingMonth.HasValue)
            reading.BillingMonth = dto.BillingMonth.Value;

        if (dto.BillingYear.HasValue)
            reading.BillingYear = dto.BillingYear.Value;

        if (!string.IsNullOrEmpty(dto.Notes))
            reading.Notes = dto.Notes;

        if (dto.IsEstimated.HasValue)
            reading.IsEstimated = dto.IsEstimated.Value;

        reading.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<MeterReadingDto>.SuccessResponse(
            MapToDto(reading),
            "Meter reading updated successfully"
        );
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var reading = await _context
            .MeterReadings.Include(m => m.Bill)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (reading == null)
        {
            return ApiResponse<bool>.ErrorResponse("Meter reading not found");
        }

        if (reading.Bill != null)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Cannot delete reading that has already been billed"
            );
        }

        _context.MeterReadings.Remove(reading);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Meter reading deleted successfully");
    }

    public async Task<ApiResponse<List<MeterReadingListDto>>> GetUnbilledReadingsAsync(
        int? billingMonth = null,
        int? billingYear = null
    )
    {
        var query = _context
            .MeterReadings.Include(m => m.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(m => m.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(m => m.Bill)
            .Where(m => m.Bill == null);

        // Apply optional filters
        if (billingMonth.HasValue)
        {
            query = query.Where(m => m.BillingMonth == billingMonth.Value);
        }
        if (billingYear.HasValue)
        {
            query = query.Where(m => m.BillingYear == billingYear.Value);
        }

        var readings = await query
            .OrderByDescending(m => m.BillingYear)
            .ThenByDescending(m => m.BillingMonth)
            .ThenBy(m => m.Connection.ConnectionNumber)
            .Select(m => new MeterReadingListDto
            {
                Id = m.Id,
                ConnectionId = m.ConnectionId,
                ConnectionNumber = m.Connection.ConnectionNumber,
                MeterNumber = m.Connection.MeterNumber,
                ConsumerName =
                    $"{m.Connection.Consumer.User.FirstName} {m.Connection.Consumer.User.LastName}",
                PreviousReading = m.PreviousReading,
                CurrentReading = m.CurrentReading,
                UnitsConsumed = m.UnitsConsumed,
                ReadingDate = m.ReadingDate,
                BillingMonth = m.BillingMonth,
                BillingYear = m.BillingYear,
                IsBilled = false,
                Status = "Pending",
                UtilityTypeName = m.Connection.UtilityType.Name,
            })
            .ToListAsync();

        return ApiResponse<List<MeterReadingListDto>>.SuccessResponse(readings);
    }

    public async Task<ApiResponse<decimal>> GetLastReadingAsync(int connectionId)
    {
        var lastReading = await GetLastReadingValueAsync(connectionId);
        return ApiResponse<decimal>.SuccessResponse(lastReading);
    }

    private async Task<decimal> GetLastReadingValueAsync(int connectionId)
    {
        var lastReading = await _context
            .MeterReadings.Where(m => m.ConnectionId == connectionId)
            .OrderByDescending(m => m.BillingYear)
            .ThenByDescending(m => m.BillingMonth)
            .FirstOrDefaultAsync();

        return lastReading?.CurrentReading ?? 0;
    }

    private static MeterReadingDto MapToDto(MeterReading reading)
    {
        var isBilled = reading.Bill != null;
        return new MeterReadingDto
        {
            Id = reading.Id,
            ConnectionId = reading.ConnectionId,
            ConnectionNumber = reading.Connection.ConnectionNumber,
            MeterNumber = reading.Connection.MeterNumber,
            ConsumerName =
                $"{reading.Connection.Consumer.User.FirstName} {reading.Connection.Consumer.User.LastName}",
            UtilityType = reading.Connection.UtilityType.Name,
            PreviousReading = reading.PreviousReading,
            CurrentReading = reading.CurrentReading,
            UnitsConsumed = reading.UnitsConsumed,
            ReadingDate = reading.ReadingDate,
            BillingMonth = reading.BillingMonth,
            BillingYear = reading.BillingYear,
            ReadByUserName =
                reading.ReadByUser != null
                    ? $"{reading.ReadByUser.FirstName} {reading.ReadByUser.LastName}"
                    : null,
            Notes = reading.Notes,
            IsEstimated = reading.IsEstimated,
            IsBilled = isBilled,
            Status = isBilled ? "Generated" : "Pending",
        };
    }
}
