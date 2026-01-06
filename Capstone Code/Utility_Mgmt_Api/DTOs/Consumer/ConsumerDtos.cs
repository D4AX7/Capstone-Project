using System.ComponentModel.DataAnnotations;

namespace UtilityManagmentApi.DTOs.Consumer;

public class ConsumerDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ConsumerNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public bool IsActive { get; set; }
    public List<ConnectionSummaryDto> Connections { get; set; } = new();
}

public class ConnectionSummaryDto
{
    public int Id { get; set; }
    public string ConnectionNumber { get; set; } = string.Empty;
    public string MeterNumber { get; set; } = string.Empty;
    public string UtilityType { get; set; } = string.Empty;
    public string TariffPlan { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class CreateConsumerDto
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string State { get; set; } = string.Empty;

    [MaxLength(20)]
    public string PostalCode { get; set; } = string.Empty;
}

public class UpdateConsumerDto
{
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? State { get; set; }

    [MaxLength(20)]
    public string? PostalCode { get; set; }

    public bool? IsActive { get; set; }
}

public class ConsumerListDto
{
    public int Id { get; set; }
    public string ConsumerNumber { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string City { get; set; } = string.Empty;
    public int TotalConnections { get; set; }
    public bool IsActive { get; set; }
}
