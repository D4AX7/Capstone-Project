using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Consumer;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class ConsumerService : IConsumerService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public ConsumerService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<ApiResponse<ConsumerDto>> GetByIdAsync(int id)
    {
        var consumer = await _context
            .Consumers.Include(c => c.User)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.UtilityType)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.TariffPlan)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (consumer == null)
        {
            return ApiResponse<ConsumerDto>.ErrorResponse("Consumer not found");
        }

        return ApiResponse<ConsumerDto>.SuccessResponse(MapToDto(consumer));
    }

    public async Task<ApiResponse<ConsumerDto>> GetByConsumerNumberAsync(string consumerNumber)
    {
        var consumer = await _context
            .Consumers.Include(c => c.User)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.UtilityType)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.TariffPlan)
            .FirstOrDefaultAsync(c => c.ConsumerNumber == consumerNumber);

        if (consumer == null)
        {
            return ApiResponse<ConsumerDto>.ErrorResponse("Consumer not found");
        }

        return ApiResponse<ConsumerDto>.SuccessResponse(MapToDto(consumer));
    }

    public async Task<ApiResponse<ConsumerDto>> GetByUserIdAsync(int userId)
    {
        var consumer = await _context
            .Consumers.Include(c => c.User)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.UtilityType)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.TariffPlan)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (consumer == null)
        {
            return ApiResponse<ConsumerDto>.ErrorResponse("Consumer not found");
        }

        return ApiResponse<ConsumerDto>.SuccessResponse(MapToDto(consumer));
    }

    public async Task<PagedResponse<ConsumerListDto>> GetAllAsync(
        PaginationParams paginationParams,
        bool? isActive = null
    )
    {
        var query = _context
            .Consumers.Include(c => c.User)
            .Include(c => c.Connections)
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        if (!string.IsNullOrEmpty(paginationParams.SearchTerm))
        {
            var searchTerm = paginationParams.SearchTerm.ToLower();
            query = query.Where(c =>
                c.ConsumerNumber.ToLower().Contains(searchTerm)
                || c.User.FirstName.ToLower().Contains(searchTerm)
                || c.User.LastName.ToLower().Contains(searchTerm)
                || c.User.Email.ToLower().Contains(searchTerm)
                || c.City.ToLower().Contains(searchTerm)
            );
        }

        // Sorting
        query = paginationParams.SortBy?.ToLower() switch
        {
            "name" => paginationParams.SortDescending
                ? query
                    .OrderByDescending(c => c.User.LastName)
                    .ThenByDescending(c => c.User.FirstName)
                : query.OrderBy(c => c.User.LastName).ThenBy(c => c.User.FirstName),
            "consumernumber" => paginationParams.SortDescending
                ? query.OrderByDescending(c => c.ConsumerNumber)
                : query.OrderBy(c => c.ConsumerNumber),
            "city" => paginationParams.SortDescending
                ? query.OrderByDescending(c => c.City)
                : query.OrderBy(c => c.City),
            _ => query.OrderByDescending(c => c.CreatedAt),
        };

        var totalRecords = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalRecords / (double)paginationParams.PageSize);

        var consumers = await query
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .Select(c => new ConsumerListDto
            {
                Id = c.Id,
                ConsumerNumber = c.ConsumerNumber,
                FullName = $"{c.User.FirstName} {c.User.LastName}",
                Email = c.User.Email,
                Phone = c.User.PhoneNumber,
                City = c.City,
                TotalConnections = c.Connections.Count,
                IsActive = c.IsActive,
            })
            .ToListAsync();

        return new PagedResponse<ConsumerListDto>
        {
            Data = consumers,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize,
            TotalPages = totalPages,
            TotalRecords = totalRecords,
        };
    }

    public async Task<ApiResponse<ConsumerDto>> CreateAsync(CreateConsumerDto dto)
    {
        // Check if email already exists
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return ApiResponse<ConsumerDto>.ErrorResponse("Email already exists");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Create user first using UserManager
            var user = new ApplicationUser
            {
                UserName = dto.Email.ToLower(),
                Email = dto.Email.ToLower(),
                EmailConfirmed = true,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneNumber = dto.Phone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return ApiResponse<ConsumerDto>.ErrorResponse($"Failed to create user: {errors}");
            }

            await _userManager.AddToRoleAsync(user, UserRoles.Consumer);

            // Generate consumer number
            var consumerNumber = await GenerateConsumerNumberAsync();

            // Create consumer
            var consumer = new Consumer
            {
                UserId = user.Id,
                ConsumerNumber = consumerNumber,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                PostalCode = dto.PostalCode,
                RegistrationDate = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Consumers.Add(consumer);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            // Reload with navigation properties
            consumer = await _context
                .Consumers.Include(c => c.User)
                .Include(c => c.Connections)
                .FirstAsync(c => c.Id == consumer.Id);

            return ApiResponse<ConsumerDto>.SuccessResponse(
                MapToDto(consumer),
                "Consumer created successfully"
            );
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<ApiResponse<ConsumerDto>> UpdateAsync(int id, UpdateConsumerDto dto)
    {
        var consumer = await _context
            .Consumers.Include(c => c.User)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.UtilityType)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.TariffPlan)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (consumer == null)
        {
            return ApiResponse<ConsumerDto>.ErrorResponse("Consumer not found");
        }

        // Update user properties
        if (!string.IsNullOrEmpty(dto.FirstName))
            consumer.User.FirstName = dto.FirstName;

        if (!string.IsNullOrEmpty(dto.LastName))
            consumer.User.LastName = dto.LastName;

        if (!string.IsNullOrEmpty(dto.Phone))
            consumer.User.PhoneNumber = dto.Phone;

        // Update consumer properties
        if (!string.IsNullOrEmpty(dto.Address))
            consumer.Address = dto.Address;

        if (!string.IsNullOrEmpty(dto.City))
            consumer.City = dto.City;

        if (!string.IsNullOrEmpty(dto.State))
            consumer.State = dto.State;

        if (!string.IsNullOrEmpty(dto.PostalCode))
            consumer.PostalCode = dto.PostalCode;

        if (dto.IsActive.HasValue)
        {
            consumer.IsActive = dto.IsActive.Value;
            consumer.User.IsActive = dto.IsActive.Value;
        }

        consumer.UpdatedAt = DateTime.UtcNow;
        consumer.User.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<ConsumerDto>.SuccessResponse(
            MapToDto(consumer),
            "Consumer updated successfully"
        );
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var consumer = await _context
            .Consumers.Include(c => c.User)
            .Include(c => c.Connections)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (consumer == null)
        {
            return ApiResponse<bool>.ErrorResponse("Consumer not found");
        }

        // Check for active connections
        if (consumer.Connections.Any(c => c.Status == ConnectionStatus.Active))
        {
            return ApiResponse<bool>.ErrorResponse(
                "Cannot delete consumer with active connections"
            );
        }

        // Soft delete
        consumer.IsActive = false;
        consumer.User.IsActive = false;
        consumer.UpdatedAt = DateTime.UtcNow;
        consumer.User.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Consumer deleted successfully");
    }

    public async Task<ApiResponse<List<ConsumerListDto>>> SearchAsync(string searchTerm)
    {
        var search = searchTerm.ToLower();

        var consumers = await _context
            .Consumers.Include(c => c.User)
            .Include(c => c.Connections)
            .Where(c =>
                c.IsActive
                && (
                    c.ConsumerNumber.ToLower().Contains(search)
                    || c.User.FirstName.ToLower().Contains(search)
                    || c.User.LastName.ToLower().Contains(search)
                    || c.User.Email.ToLower().Contains(search)
                )
            )
            .Take(20)
            .Select(c => new ConsumerListDto
            {
                Id = c.Id,
                ConsumerNumber = c.ConsumerNumber,
                FullName = $"{c.User.FirstName} {c.User.LastName}",
                Email = c.User.Email,
                Phone = c.User.PhoneNumber,
                City = c.City,
                TotalConnections = c.Connections.Count,
                IsActive = c.IsActive,
            })
            .ToListAsync();

        return ApiResponse<List<ConsumerListDto>>.SuccessResponse(consumers);
    }

    private async Task<string> GenerateConsumerNumberAsync()
    {
        var year = DateTime.UtcNow.Year.ToString()[2..];
        var lastConsumer = await _context
            .Consumers.Where(c => c.ConsumerNumber.StartsWith($"CON{year}"))
            .OrderByDescending(c => c.ConsumerNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastConsumer != null)
        {
            var lastNumber = lastConsumer.ConsumerNumber[5..];
            if (int.TryParse(lastNumber, out int num))
            {
                nextNumber = num + 1;
            }
        }

        return $"CON{year}{nextNumber:D6}";
    }

    private static ConsumerDto MapToDto(Consumer consumer)
    {
        return new ConsumerDto
        {
            Id = consumer.Id,
            UserId = consumer.UserId,
            ConsumerNumber = consumer.ConsumerNumber,
            FirstName = consumer.User.FirstName,
            LastName = consumer.User.LastName,
            Email = consumer.User.Email,
            Phone = consumer.User.PhoneNumber,
            Address = consumer.Address,
            City = consumer.City,
            State = consumer.State,
            PostalCode = consumer.PostalCode,
            RegistrationDate = consumer.RegistrationDate,
            IsActive = consumer.IsActive,
            Connections = consumer
                .Connections.Select(c => new ConnectionSummaryDto
                {
                    Id = c.Id,
                    ConnectionNumber = c.ConnectionNumber,
                    MeterNumber = c.MeterNumber,
                    UtilityType = c.UtilityType.Name,
                    TariffPlan = c.TariffPlan.Name,
                    Status = c.Status.ToString(),
                })
                .ToList(),
        };
    }
}
