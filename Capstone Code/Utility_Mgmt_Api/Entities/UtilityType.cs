using System.ComponentModel.DataAnnotations;

namespace UtilityManagmentApi.Entities;

public class UtilityType
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // Electricity, Water, Gas, Internet

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(20)]
    public string UnitOfMeasurement { get; set; } = string.Empty; // kWh, Gallons, Cubic Feet, GB

    /// <summary>
    /// Billing cycle duration in months (1 = Monthly, 2 = Bi-Monthly, 3 = Quarterly)
    /// </summary>
    public int BillingCycleMonths { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<TariffPlan> TariffPlans { get; set; } = new List<TariffPlan>();
    public ICollection<Connection> Connections { get; set; } = new List<Connection>();
}
