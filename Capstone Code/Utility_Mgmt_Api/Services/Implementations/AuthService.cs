using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Auth;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IConfiguration _configuration;

    public AuthService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<ApplicationRole> roleManager,
        IConfiguration configuration
    )
    {
        _context = context;
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _configuration = configuration;
    }

    public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request)
    {
        var user = await _userManager
            .Users.Include(u => u.Consumer)
            .FirstOrDefaultAsync(u => u.Email!.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            return ApiResponse<LoginResponseDto>.ErrorResponse("Invalid email or password");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: false
        );
        if (!result.Succeeded)
        {
            return ApiResponse<LoginResponseDto>.ErrorResponse("Invalid email or password");
        }

        if (!user.IsActive)
        {
            return ApiResponse<LoginResponseDto>.ErrorResponse("User account is inactive");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles);
        var refreshToken = GenerateRefreshToken();

        var response = new LoginResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = DateTime.UtcNow.AddHours(
                double.Parse(_configuration["JwtSettings:ExpirationHours"] ?? "24")
            ),
            User = await MapToUserDtoAsync(user),
        };

        return ApiResponse<LoginResponseDto>.SuccessResponse(response, "Login successful");
    }

    public async Task<ApiResponse<UserDto>> RegisterAsync(RegisterRequestDto request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return ApiResponse<UserDto>.ErrorResponse("Email already exists");
        }

        // Validate role
        if (!UserRoles.AllRoles.Contains(request.Role))
        {
            return ApiResponse<UserDto>.ErrorResponse("Invalid role specified");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email.ToLower(),
            Email = request.Email.ToLower(),
            EmailConfirmed = true,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.Phone,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return ApiResponse<UserDto>.ErrorResponse($"Registration failed: {errors}");
        }

        await _userManager.AddToRoleAsync(user, request.Role);

        return ApiResponse<UserDto>.SuccessResponse(
            await MapToUserDtoAsync(user),
            "User registered successfully"
        );
    }

    /// <summary>
    /// Public Consumer Registration - automatically assigns Consumer role and creates consumer profile
    /// </summary>
    public async Task<ApiResponse<LoginResponseDto>> RegisterConsumerAsync(
        ConsumerRegisterDto request
    )
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return ApiResponse<LoginResponseDto>.ErrorResponse("Email already exists");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Create User with Consumer role
            var user = new ApplicationUser
            {
                UserName = request.Email.ToLower(),
                Email = request.Email.ToLower(),
                EmailConfirmed = true,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.Phone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return ApiResponse<LoginResponseDto>.ErrorResponse(
                    $"Registration failed: {errors}"
                );
            }

            await _userManager.AddToRoleAsync(user, UserRoles.Consumer);

            // Generate Consumer Number
            var consumerNumber = await GenerateConsumerNumberAsync();

            // Create Consumer Profile
            var consumer = new Consumer
            {
                UserId = user.Id,
                ConsumerNumber = consumerNumber,
                Address = request.Address,
                City = request.City,
                State = request.State,
                PostalCode = request.PostalCode,
                RegistrationDate = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Consumers.Add(consumer);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            // Generate token and return login response
            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);
            var refreshToken = GenerateRefreshToken();

            // Reload user with consumer
            user.Consumer = consumer;

            var response = new LoginResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Expiration = DateTime.UtcNow.AddHours(
                    double.Parse(_configuration["JwtSettings:ExpirationHours"] ?? "24")
                ),
                User = await MapToUserDtoAsync(user),
            };

            return ApiResponse<LoginResponseDto>.SuccessResponse(
                response,
                "Registration successful. You are now logged in."
            );
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return ApiResponse<LoginResponseDto>.ErrorResponse(
                "Registration failed. Please try again."
            );
        }
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return ApiResponse<bool>.ErrorResponse("User not found");
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword
        );
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            if (errors.Contains("Incorrect password"))
            {
                return ApiResponse<bool>.ErrorResponse("Current password is incorrect");
            }
            return ApiResponse<bool>.ErrorResponse($"Password change failed: {errors}");
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return ApiResponse<bool>.SuccessResponse(true, "Password changed successfully");
    }

    public async Task<ApiResponse<UserDto>> GetUserByIdAsync(int userId)
    {
        var user = await _userManager
            .Users.Include(u => u.Consumer)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return ApiResponse<UserDto>.ErrorResponse("User not found");
        }

        return ApiResponse<UserDto>.SuccessResponse(await MapToUserDtoAsync(user));
    }

    public async Task<PagedResponse<UserDto>> GetAllUsersAsync(PaginationParams paginationParams)
    {
        var query = _userManager
            .Users.Include(u => u.Consumer)
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName);

        var totalRecords = await query.CountAsync();

        var users = await query
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();

        var userDtos = new List<UserDto>();
        foreach (var user in users)
        {
            userDtos.Add(await MapToUserDtoAsync(user));
        }

        return new PagedResponse<UserDto>
        {
            Data = userDtos,
            Success = true,
            TotalRecords = totalRecords,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };
    }

    public async Task<ApiResponse<UserDto>> UpdateUserAsync(int userId, UpdateUserDto request)
    {
        var user = await _userManager
            .Users.Include(u => u.Consumer)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return ApiResponse<UserDto>.ErrorResponse("User not found");
        }

        // Get current role
        var currentRoles = await _userManager.GetRolesAsync(user);
        var currentRole = currentRoles.FirstOrDefault();

        // Check if role is being changed
        if (!string.IsNullOrEmpty(request.Role) && request.Role != currentRole)
        {
            // Validate the new role
            if (!UserRoles.AllRoles.Contains(request.Role))
            {
                return ApiResponse<UserDto>.ErrorResponse("Invalid role specified");
            }

            // If changing from Consumer to another role, check for active connections
            if (currentRole == UserRoles.Consumer && user.Consumer != null)
            {
                var activeConnections = await _context
                    .Connections.Where(c =>
                        c.ConsumerId == user.Consumer.Id
                        && c.Status == Entities.ConnectionStatus.Active
                    )
                    .CountAsync();

                if (activeConnections > 0)
                {
                    return ApiResponse<UserDto>.ErrorResponse(
                        $"Cannot change role. This consumer has {activeConnections} active connection(s). Please disconnect or transfer all connections before changing the role."
                    );
                }
            }

            // Remove current role and add new role
            if (currentRole != null)
            {
                await _userManager.RemoveFromRoleAsync(user, currentRole);
            }
            await _userManager.AddToRoleAsync(user, request.Role);
        }

        if (!string.IsNullOrEmpty(request.FirstName))
            user.FirstName = request.FirstName;

        if (!string.IsNullOrEmpty(request.LastName))
            user.LastName = request.LastName;

        if (!string.IsNullOrEmpty(request.Phone))
            user.PhoneNumber = request.Phone;

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return ApiResponse<UserDto>.ErrorResponse($"Update failed: {errors}");
        }

        return ApiResponse<UserDto>.SuccessResponse(
            await MapToUserDtoAsync(user),
            "User updated successfully"
        );
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(int userId)
    {
        var user = await _userManager
            .Users.Include(u => u.Consumer)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return ApiResponse<bool>.ErrorResponse("User not found");
        }

        // Check if user has related data that prevents deletion
        if (user.Consumer != null)
        {
            var consumerId = user.Consumer.Id;
            
            // Check for ACTIVE connections only - Disconnected connections are OK to delete
            var hasActiveConnections = await _context.Connections.AnyAsync(c =>
                c.ConsumerId == consumerId && c.Status == Entities.ConnectionStatus.Active
            );

            if (hasActiveConnections)
            {
                return ApiResponse<bool>.ErrorResponse(
                    "Cannot delete user with active connections. Please disconnect all connections first."
                );
            }

            // Check for UNPAID bills only (Due or Overdue) - Paid bills are OK
            var hasUnpaidBills = await _context.Bills.AnyAsync(b =>
                b.Connection.ConsumerId == consumerId && 
                (b.Status == Entities.BillStatus.Due || b.Status == Entities.BillStatus.Overdue)
            );

            if (hasUnpaidBills)
            {
                return ApiResponse<bool>.ErrorResponse(
                    "Cannot delete user with unpaid bills. Please ensure all bills are paid first."
                );
            }

            // Safe to delete - remove all related data
            // Remove payments first (due to foreign key constraints)
            var payments = await _context.Payments
                .Where(p => p.Bill.Connection.ConsumerId == consumerId)
                .ToListAsync();
            _context.Payments.RemoveRange(payments);

            // Remove bills
            var bills = await _context.Bills
                .Where(b => b.Connection.ConsumerId == consumerId)
                .ToListAsync();
            _context.Bills.RemoveRange(bills);

            // Remove meter readings
            var meterReadings = await _context.MeterReadings
                .Where(m => m.Connection.ConsumerId == consumerId)
                .ToListAsync();
            _context.MeterReadings.RemoveRange(meterReadings);

            // Remove connections
            var connections = await _context.Connections
                .Where(c => c.ConsumerId == consumerId)
                .ToListAsync();
            _context.Connections.RemoveRange(connections);

            // Remove connection requests
            var connectionRequests = await _context.ConnectionRequests
                .Where(cr => cr.ConsumerId == consumerId)
                .ToListAsync();
            _context.ConnectionRequests.RemoveRange(connectionRequests);

            // Remove consumer profile
            _context.Consumers.Remove(user.Consumer);
            await _context.SaveChangesAsync();
        }

        // Remove notifications
        var notifications = await _context
            .Notifications.Where(n => n.UserId == userId)
            .ToListAsync();
        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();

        // Delete user using UserManager
        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return ApiResponse<bool>.ErrorResponse($"Delete failed: {errors}");
        }

        return ApiResponse<bool>.SuccessResponse(true, "User deleted successfully");
    }

    private async Task<string> GenerateConsumerNumberAsync()
    {
        var year = DateTime.UtcNow.Year.ToString().Substring(2);
        var lastConsumer = await _context
            .Consumers.Where(c => c.ConsumerNumber.StartsWith($"CON{year}"))
            .OrderByDescending(c => c.ConsumerNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastConsumer != null)
        {
            var lastNumberStr = lastConsumer.ConsumerNumber.Substring(5);
            if (int.TryParse(lastNumberStr, out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"CON{year}{nextNumber:D4}";
    }

    private string GenerateJwtToken(ApplicationUser user, IList<string> roles)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]!)
        );
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim("userId", user.Id.ToString()),
        };

        // Add role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Add consumer number to claims if user is a consumer
        if (user.Consumer != null)
        {
            claims.Add(new Claim("consumerNumber", user.Consumer.ConsumerNumber));
            claims.Add(new Claim("consumerId", user.Consumer.Id.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(
                double.Parse(_configuration["JwtSettings:ExpirationHours"] ?? "24")
            ),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
    }

    private async Task<UserDto> MapToUserDtoAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Unknown";

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email!,
            Phone = user.PhoneNumber,
            Role = role,
            IsActive = user.IsActive,
            CreatedAt = DateTime.SpecifyKind(user.CreatedAt, DateTimeKind.Utc).ToLocalTime(),
            ConsumerNumber = user.Consumer?.ConsumerNumber,
        };
    }
}
