using System.ComponentModel.DataAnnotations;

namespace UtilityManagmentApi.DTOs.UtilityType;

public class UtilityTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string UnitOfMeasurement { get; set; } = string.Empty;
    public int BillingCycleMonths { get; set; } = 1;
    public bool IsActive { get; set; }
    public int TariffPlanCount { get; set; }
    public int ConnectionCount { get; set; }
}

public class CreateUtilityTypeDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(20)]
    public string UnitOfMeasurement { get; set; } = string.Empty;

    [Range(1, 3)]
    public int BillingCycleMonths { get; set; } = 1;
}

public class UpdateUtilityTypeDto
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(20)]
    public string? UnitOfMeasurement { get; set; }

    [Range(1, 3)]
    public int? BillingCycleMonths { get; set; }

    public bool? IsActive { get; set; }
}
