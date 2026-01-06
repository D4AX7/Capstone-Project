using System.ComponentModel.DataAnnotations;

namespace UtilityManagmentApi.DTOs.Payment;

public class PaymentDto
{
    public int Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public int BillId { get; set; }
    public string BillNumber { get; set; } = string.Empty;
    public string ConsumerName { get; set; } = string.Empty;
    public string ConsumerNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionReference { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ReceivedByUserName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePaymentDto
{
    [Required]
    public int BillId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    public DateTime? PaymentDate { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? TransactionReference { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdatePaymentStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class PaymentListDto
{
    public int Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public string BillNumber { get; set; } = string.Empty;
    public string ConsumerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class PaymentSummaryDto
{
    public int TotalPayments { get; set; }
    public decimal TotalAmount { get; set; }
    public Dictionary<string, decimal> ByPaymentMethod { get; set; } = new();
    public decimal TodayCollection { get; set; }
    public decimal ThisMonthCollection { get; set; }
}
