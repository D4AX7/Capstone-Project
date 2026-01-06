using System.ComponentModel.DataAnnotations;

namespace UtilityManagmentApi.DTOs.ConnectionRequest;

public class ConnectionRequestDto
{
    public int Id { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public int ConsumerId { get; set; }
    public string ConsumerName { get; set; } = string.Empty;
    public string ConsumerNumber { get; set; } = string.Empty;
    public int UtilityTypeId { get; set; }
    public string UtilityTypeName { get; set; } = string.Empty;
    public int TariffPlanId { get; set; }
    public string TariffPlanName { get; set; } = string.Empty;
    public decimal? LoadSanctioned { get; set; }
    public string? InstallationAddress { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdminRemarks { get; set; }
    public string? ProcessedByUserName { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public int? CreatedConnectionId { get; set; }
    public string? CreatedConnectionNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ConnectionRequestListDto
{
    public int Id { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public string ConsumerName { get; set; } = string.Empty;
    public string ConsumerNumber { get; set; } = string.Empty;
    public string UtilityTypeName { get; set; } = string.Empty;
    public string TariffPlanName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class CreateConnectionRequestDto
{
    [Required]
    public int UtilityTypeId { get; set; }

    [Required]
    public int TariffPlanId { get; set; }

    public decimal? LoadSanctioned { get; set; }

    [MaxLength(500)]
    public string? InstallationAddress { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }
}

public class ProcessConnectionRequestDto
{
    [Required]
    public bool Approve { get; set; }

    [MaxLength(1000)]
    public string? AdminRemarks { get; set; }

    // Only required if approving - Admin can optionally provide meter number
    [MaxLength(50)]
    public string? MeterNumber { get; set; }
}

public class AvailableUtilityDto
{
    public int UtilityTypeId { get; set; }
    public string UtilityTypeName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string UnitOfMeasurement { get; set; } = string.Empty;
    public List<AvailableTariffPlanDto> TariffPlans { get; set; } = new();
}

public class AvailableTariffPlanDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal RatePerUnit { get; set; }
    public decimal FixedCharges { get; set; }
    public decimal TaxPercentage { get; set; }
}
