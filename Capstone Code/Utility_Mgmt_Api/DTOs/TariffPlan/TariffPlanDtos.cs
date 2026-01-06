using System.ComponentModel.DataAnnotations;

namespace UtilityManagmentApi.DTOs.TariffPlan;

public class TariffPlanDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int UtilityTypeId { get; set; }
    public string UtilityTypeName { get; set; } = string.Empty;
    public decimal RatePerUnit { get; set; }
    public decimal FixedCharges { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal LatePaymentPenalty { get; set; }
    public int? SlabMinUnits { get; set; }
    public int? SlabMaxUnits { get; set; }
    public bool IsActive { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public int ConnectionCount { get; set; }
}

public class CreateTariffPlanDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public int UtilityTypeId { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal RatePerUnit { get; set; }

    [Range(0, double.MaxValue)]
    public decimal FixedCharges { get; set; }

    [Range(0, 100)]
    public decimal TaxPercentage { get; set; }

    [Range(0, double.MaxValue)]
    public decimal LatePaymentPenalty { get; set; }

    public int? SlabMinUnits { get; set; }
    public int? SlabMaxUnits { get; set; }

    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class UpdateTariffPlanDto
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? RatePerUnit { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? FixedCharges { get; set; }

    [Range(0, 100)]
    public decimal? TaxPercentage { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? LatePaymentPenalty { get; set; }

    public int? SlabMinUnits { get; set; }
    public int? SlabMaxUnits { get; set; }

    public bool? IsActive { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class TariffPlanListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UtilityTypeName { get; set; } = string.Empty;
    public decimal RatePerUnit { get; set; }
    public decimal FixedCharges { get; set; }
    public bool IsActive { get; set; }
}
