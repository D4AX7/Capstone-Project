using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace UtilityManagmentApi.Entities;

/// <summary>
/// Application user extending IdentityUser with custom properties
/// </summary>
public class ApplicationUser : IdentityUser<int>
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Consumer? Consumer { get; set; }

    // Helper property to get full name
    public string FullName => $"{FirstName} {LastName}";
}

/// <summary>
/// Application role extending IdentityRole
/// </summary>
public class ApplicationRole : IdentityRole<int>
{
    public string? Description { get; set; }

    public ApplicationRole()
        : base() { }

    public ApplicationRole(string roleName)
        : base(roleName) { }
}

/// <summary>
/// Static class containing role names as constants
/// </summary>
public static class UserRoles
{
    public const string Admin = "Admin";
    public const string BillingOfficer = "BillingOfficer";
    public const string AccountOfficer = "AccountOfficer";
    public const string Consumer = "Consumer";

    public static readonly string[] AllRoles = { Admin, BillingOfficer, AccountOfficer, Consumer };
}
