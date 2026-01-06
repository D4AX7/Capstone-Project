using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.UtilityType;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class UtilityTypeService : IUtilityTypeService
{
    private readonly ApplicationDbContext _context;

    public UtilityTypeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<UtilityTypeDto>> GetByIdAsync(int id)
    {
        var utilityType = await _context
            .UtilityTypes.Include(u => u.TariffPlans)
            .Include(u => u.Connections)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (utilityType == null)
        {
            return ApiResponse<UtilityTypeDto>.ErrorResponse("Utility type not found");
        }

        return ApiResponse<UtilityTypeDto>.SuccessResponse(MapToDto(utilityType));
    }

    public async Task<ApiResponse<List<UtilityTypeDto>>> GetAllAsync(bool? isActive = null)
    {
        var query = _context
            .UtilityTypes.Include(u => u.TariffPlans)
            .Include(u => u.Connections)
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var utilityTypes = await query.OrderBy(u => u.Name).Select(u => MapToDto(u)).ToListAsync();

        return ApiResponse<List<UtilityTypeDto>>.SuccessResponse(utilityTypes);
    }

    public async Task<ApiResponse<UtilityTypeDto>> CreateAsync(CreateUtilityTypeDto dto)
    {
        if (await _context.UtilityTypes.AnyAsync(u => u.Name.ToLower() == dto.Name.ToLower()))
        {
            return ApiResponse<UtilityTypeDto>.ErrorResponse(
                "Utility type with this name already exists"
            );
        }

        var utilityType = new UtilityType
        {
            Name = dto.Name,
            Description = dto.Description,
            UnitOfMeasurement = dto.UnitOfMeasurement,
            BillingCycleMonths = dto.BillingCycleMonths,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _context.UtilityTypes.Add(utilityType);
        await _context.SaveChangesAsync();

        return ApiResponse<UtilityTypeDto>.SuccessResponse(
            MapToDto(utilityType),
            "Utility type created successfully"
        );
    }

    public async Task<ApiResponse<UtilityTypeDto>> UpdateAsync(int id, UpdateUtilityTypeDto dto)
    {
        var utilityType = await _context
            .UtilityTypes.Include(u => u.TariffPlans)
            .Include(u => u.Connections)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (utilityType == null)
        {
            return ApiResponse<UtilityTypeDto>.ErrorResponse("Utility type not found");
        }

        if (!string.IsNullOrEmpty(dto.Name) && dto.Name.ToLower() != utilityType.Name.ToLower())
        {
            if (
                await _context.UtilityTypes.AnyAsync(u =>
                    u.Name.ToLower() == dto.Name.ToLower() && u.Id != id
                )
            )
            {
                return ApiResponse<UtilityTypeDto>.ErrorResponse(
                    "Utility type with this name already exists"
                );
            }
            utilityType.Name = dto.Name;
        }

        if (!string.IsNullOrEmpty(dto.Description))
            utilityType.Description = dto.Description;

        if (!string.IsNullOrEmpty(dto.UnitOfMeasurement))
            utilityType.UnitOfMeasurement = dto.UnitOfMeasurement;

        if (dto.BillingCycleMonths.HasValue)
            utilityType.BillingCycleMonths = dto.BillingCycleMonths.Value;

        if (dto.IsActive.HasValue)
        {
            utilityType.IsActive = dto.IsActive.Value;

            if (dto.IsActive.Value)
            {
                // If utility type is being activated, also activate all its connections and tariff plans
                foreach (var connection in utilityType.Connections)
                {
                    connection.Status = ConnectionStatus.Active;
                }

                foreach (var tariffPlan in utilityType.TariffPlans)
                {
                    tariffPlan.IsActive = true;
                }
            }
            else
            {
                // If utility type is being deactivated, also deactivate all its connections and tariff plans
                foreach (var connection in utilityType.Connections)
                {
                    connection.Status = ConnectionStatus.Inactive;
                }

                foreach (var tariffPlan in utilityType.TariffPlans)
                {
                    tariffPlan.IsActive = false;
                }
            }
        }

        await _context.SaveChangesAsync();

        return ApiResponse<UtilityTypeDto>.SuccessResponse(
            MapToDto(utilityType),
            "Utility type updated successfully"
        );
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var utilityType = await _context
            .UtilityTypes.Include(u => u.Connections)
            .Include(u => u.TariffPlans)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (utilityType == null)
        {
            return ApiResponse<bool>.ErrorResponse("Utility type not found");
        }

        if (utilityType.Connections.Any())
        {
            return ApiResponse<bool>.ErrorResponse(
                "Cannot delete utility type with active connections"
            );
        }

        if (utilityType.TariffPlans.Any())
        {
            return ApiResponse<bool>.ErrorResponse(
                "Cannot delete utility type with associated tariff plans. Please delete the tariff plans first."
            );
        }

        // Hard delete - completely remove from database
        _context.UtilityTypes.Remove(utilityType);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Utility type deleted successfully");
    }

    private static UtilityTypeDto MapToDto(UtilityType utilityType)
    {
        return new UtilityTypeDto
        {
            Id = utilityType.Id,
            Name = utilityType.Name,
            Description = utilityType.Description,
            UnitOfMeasurement = utilityType.UnitOfMeasurement,
            BillingCycleMonths = utilityType.BillingCycleMonths,
            IsActive = utilityType.IsActive,
            TariffPlanCount = utilityType.TariffPlans?.Count ?? 0,
            ConnectionCount = utilityType.Connections?.Count ?? 0,
        };
    }
}
