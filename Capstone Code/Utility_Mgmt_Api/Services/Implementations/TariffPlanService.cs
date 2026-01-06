using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.TariffPlan;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class TariffPlanService : ITariffPlanService
{
    private readonly ApplicationDbContext _context;

    public TariffPlanService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<TariffPlanDto>> GetByIdAsync(int id)
    {
        var tariffPlan = await _context
            .TariffPlans.Include(t => t.UtilityType)
            .Include(t => t.Connections)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tariffPlan == null)
        {
            return ApiResponse<TariffPlanDto>.ErrorResponse("Tariff plan not found");
        }

        return ApiResponse<TariffPlanDto>.SuccessResponse(MapToDto(tariffPlan));
    }

    public async Task<ApiResponse<List<TariffPlanDto>>> GetAllAsync(
        bool? isActive = null,
        int? utilityTypeId = null
    )
    {
        var query = _context
            .TariffPlans.Include(t => t.UtilityType)
            .Include(t => t.Connections)
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(t => t.IsActive == isActive.Value);
        }

        if (utilityTypeId.HasValue)
        {
            query = query.Where(t => t.UtilityTypeId == utilityTypeId.Value);
        }

        var tariffPlans = await query
            .OrderBy(t => t.UtilityType.Name)
            .ThenBy(t => t.Name)
            .Select(t => MapToDto(t))
            .ToListAsync();

        return ApiResponse<List<TariffPlanDto>>.SuccessResponse(tariffPlans);
    }

    public async Task<PagedResponse<TariffPlanListDto>> GetPagedAsync(
        PaginationParams paginationParams,
        bool? isActive = null,
        int? utilityTypeId = null
    )
    {
        var query = _context.TariffPlans.Include(t => t.UtilityType).AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(t => t.IsActive == isActive.Value);
        }

        if (utilityTypeId.HasValue)
        {
            query = query.Where(t => t.UtilityTypeId == utilityTypeId.Value);
        }

        if (!string.IsNullOrEmpty(paginationParams.SearchTerm))
        {
            var searchTerm = paginationParams.SearchTerm.ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(searchTerm)
                || t.UtilityType.Name.ToLower().Contains(searchTerm)
            );
        }

        var totalRecords = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalRecords / (double)paginationParams.PageSize);

        var tariffPlans = await query
            .OrderBy(t => t.UtilityType.Name)
            .ThenBy(t => t.Name)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .Select(t => new TariffPlanListDto
            {
                Id = t.Id,
                Name = t.Name,
                UtilityTypeName = t.UtilityType.Name,
                RatePerUnit = t.RatePerUnit,
                FixedCharges = t.FixedCharges,
                IsActive = t.IsActive,
            })
            .ToListAsync();

        return new PagedResponse<TariffPlanListDto>
        {
            Data = tariffPlans,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize,
            TotalPages = totalPages,
            TotalRecords = totalRecords,
        };
    }

    public async Task<ApiResponse<TariffPlanDto>> CreateAsync(CreateTariffPlanDto dto)
    {
        var utilityType = await _context.UtilityTypes.FindAsync(dto.UtilityTypeId);
        if (utilityType == null)
        {
            return ApiResponse<TariffPlanDto>.ErrorResponse("Utility type not found");
        }

        var tariffPlan = new TariffPlan
        {
            Name = dto.Name,
            Description = dto.Description,
            UtilityTypeId = dto.UtilityTypeId,
            RatePerUnit = dto.RatePerUnit,
            FixedCharges = dto.FixedCharges,
            TaxPercentage = dto.TaxPercentage,
            LatePaymentPenalty = dto.LatePaymentPenalty,
            SlabMinUnits = dto.SlabMinUnits,
            SlabMaxUnits = dto.SlabMaxUnits,
            IsActive = true,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.UtcNow,
            EffectiveTo = dto.EffectiveTo,
            CreatedAt = DateTime.UtcNow,
        };

        _context.TariffPlans.Add(tariffPlan);
        await _context.SaveChangesAsync();

        tariffPlan.UtilityType = utilityType;

        return ApiResponse<TariffPlanDto>.SuccessResponse(
            MapToDto(tariffPlan),
            "Tariff plan created successfully"
        );
    }

    public async Task<ApiResponse<TariffPlanDto>> UpdateAsync(int id, UpdateTariffPlanDto dto)
    {
        var tariffPlan = await _context
            .TariffPlans.Include(t => t.UtilityType)
            .Include(t => t.Connections)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tariffPlan == null)
        {
            return ApiResponse<TariffPlanDto>.ErrorResponse("Tariff plan not found");
        }

        if (!string.IsNullOrEmpty(dto.Name))
            tariffPlan.Name = dto.Name;

        if (!string.IsNullOrEmpty(dto.Description))
            tariffPlan.Description = dto.Description;

        if (dto.RatePerUnit.HasValue)
            tariffPlan.RatePerUnit = dto.RatePerUnit.Value;

        if (dto.FixedCharges.HasValue)
            tariffPlan.FixedCharges = dto.FixedCharges.Value;

        if (dto.TaxPercentage.HasValue)
            tariffPlan.TaxPercentage = dto.TaxPercentage.Value;

        if (dto.LatePaymentPenalty.HasValue)
            tariffPlan.LatePaymentPenalty = dto.LatePaymentPenalty.Value;

        if (dto.SlabMinUnits.HasValue)
            tariffPlan.SlabMinUnits = dto.SlabMinUnits.Value;

        if (dto.SlabMaxUnits.HasValue)
            tariffPlan.SlabMaxUnits = dto.SlabMaxUnits.Value;

        if (dto.IsActive.HasValue)
        {
            tariffPlan.IsActive = dto.IsActive.Value;

            if (dto.IsActive.Value)
            {
                // If tariff plan is being activated, also activate all its connections
                foreach (var connection in tariffPlan.Connections)
                {
                    connection.Status = ConnectionStatus.Active;
                }
            }
            else
            {
                // If tariff plan is being deactivated, also deactivate all its connections
                foreach (var connection in tariffPlan.Connections)
                {
                    connection.Status = ConnectionStatus.Inactive;
                }
            }
        }

        if (dto.EffectiveTo.HasValue)
            tariffPlan.EffectiveTo = dto.EffectiveTo.Value;

        await _context.SaveChangesAsync();

        return ApiResponse<TariffPlanDto>.SuccessResponse(
            MapToDto(tariffPlan),
            "Tariff plan updated successfully"
        );
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var tariffPlan = await _context
            .TariffPlans.Include(t => t.Connections)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tariffPlan == null)
        {
            return ApiResponse<bool>.ErrorResponse("Tariff plan not found");
        }

        if (tariffPlan.Connections.Any())
        {
            return ApiResponse<bool>.ErrorResponse(
                "Cannot delete tariff plan with active connections"
            );
        }

        // Soft delete
        tariffPlan.IsActive = false;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Tariff plan deleted successfully");
    }

    public async Task<ApiResponse<List<TariffPlanListDto>>> GetByUtilityTypeAsync(int utilityTypeId)
    {
        var tariffPlans = await _context
            .TariffPlans.Include(t => t.UtilityType)
            .Where(t => t.UtilityTypeId == utilityTypeId && t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new TariffPlanListDto
            {
                Id = t.Id,
                Name = t.Name,
                UtilityTypeName = t.UtilityType.Name,
                RatePerUnit = t.RatePerUnit,
                FixedCharges = t.FixedCharges,
                IsActive = t.IsActive,
            })
            .ToListAsync();

        return ApiResponse<List<TariffPlanListDto>>.SuccessResponse(tariffPlans);
    }

    private static TariffPlanDto MapToDto(TariffPlan tariffPlan)
    {
        return new TariffPlanDto
        {
            Id = tariffPlan.Id,
            Name = tariffPlan.Name,
            Description = tariffPlan.Description,
            UtilityTypeId = tariffPlan.UtilityTypeId,
            UtilityTypeName = tariffPlan.UtilityType?.Name ?? string.Empty,
            RatePerUnit = tariffPlan.RatePerUnit,
            FixedCharges = tariffPlan.FixedCharges,
            TaxPercentage = tariffPlan.TaxPercentage,
            LatePaymentPenalty = tariffPlan.LatePaymentPenalty,
            SlabMinUnits = tariffPlan.SlabMinUnits,
            SlabMaxUnits = tariffPlan.SlabMaxUnits,
            IsActive = tariffPlan.IsActive,
            EffectiveFrom = tariffPlan.EffectiveFrom,
            EffectiveTo = tariffPlan.EffectiveTo,
            ConnectionCount = tariffPlan.Connections?.Count ?? 0,
        };
    }
}
