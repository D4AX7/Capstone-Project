using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UtilityManagmentApi.Entities;

public class ConnectionRequest
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ConsumerId { get; set; }

    [Required]
    public int UtilityTypeId { get; set; }

    [Required]
    public int TariffPlanId { get; set; }

    [Required]
    [MaxLength(100)]
    public string RequestNumber { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? LoadSanctioned { get; set; } // For electricity

    [MaxLength(500)]
    public string? InstallationAddress { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; } // Consumer's remarks/reason for request

    public ConnectionRequestStatus Status { get; set; } = ConnectionRequestStatus.Pending;

    [MaxLength(1000)]
    public string? AdminRemarks { get; set; } // Admin's remarks on approval/rejection

    public int? ProcessedByUserId { get; set; } // Admin who processed the request

    public DateTime? ProcessedAt { get; set; }

    public int? CreatedConnectionId { get; set; } // Reference to the connection if approved

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ConsumerId")]
    public Consumer Consumer { get; set; } = null!;

    [ForeignKey("UtilityTypeId")]
    public UtilityType UtilityType { get; set; } = null!;

    [ForeignKey("TariffPlanId")]
    public TariffPlan TariffPlan { get; set; } = null!;

    [ForeignKey("ProcessedByUserId")]
    public ApplicationUser? ProcessedByUser { get; set; }

    [ForeignKey("CreatedConnectionId")]
    public Connection? CreatedConnection { get; set; }
}

public enum ConnectionRequestStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4,
}
