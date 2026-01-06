using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Payment;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;

    public PaymentService(
        ApplicationDbContext context,
        INotificationService notificationService,
        UserManager<ApplicationUser> userManager
    )
    {
        _context = context;
        _notificationService = notificationService;
        _userManager = userManager;
    }

    public async Task<ApiResponse<PaymentDto>> GetByIdAsync(int id)
    {
        var payment = await _context
            .Payments.Include(p => p.Bill)
                .ThenInclude(b => b.Connection)
                    .ThenInclude(c => c.Consumer)
                        .ThenInclude(co => co.User)
            .Include(p => p.ReceivedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
        {
            return ApiResponse<PaymentDto>.ErrorResponse("Payment not found");
        }

        return ApiResponse<PaymentDto>.SuccessResponse(MapToDto(payment));
    }

    public async Task<ApiResponse<PaymentDto>> GetByPaymentNumberAsync(string paymentNumber)
    {
        var payment = await _context
            .Payments.Include(p => p.Bill)
                .ThenInclude(b => b.Connection)
                    .ThenInclude(c => c.Consumer)
                        .ThenInclude(co => co.User)
            .Include(p => p.ReceivedByUser)
            .FirstOrDefaultAsync(p => p.PaymentNumber == paymentNumber);

        if (payment == null)
        {
            return ApiResponse<PaymentDto>.ErrorResponse("Payment not found");
        }

        return ApiResponse<PaymentDto>.SuccessResponse(MapToDto(payment));
    }

    public async Task<ApiResponse<List<PaymentDto>>> GetByBillIdAsync(int billId)
    {
        var payments = await _context
            .Payments.Include(p => p.Bill)
                .ThenInclude(b => b.Connection)
                    .ThenInclude(c => c.Consumer)
                        .ThenInclude(co => co.User)
            .Include(p => p.ReceivedByUser)
            .Where(p => p.BillId == billId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        return ApiResponse<List<PaymentDto>>.SuccessResponse(payments.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<List<PaymentDto>>> GetByConsumerIdAsync(int consumerId)
    {
        var payments = await _context
            .Payments.Include(p => p.Bill)
                .ThenInclude(b => b.Connection)
                    .ThenInclude(c => c.Consumer)
                        .ThenInclude(co => co.User)
            .Include(p => p.ReceivedByUser)
            .Where(p => p.Bill.Connection.ConsumerId == consumerId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        return ApiResponse<List<PaymentDto>>.SuccessResponse(payments.Select(MapToDto).ToList());
    }

    public async Task<PagedResponse<PaymentListDto>> GetAllAsync(
        PaginationParams paginationParams,
        string? paymentMethod = null,
        DateTime? fromDate = null,
        DateTime? toDate = null
    )
    {
        var query = _context
            .Payments.Include(p => p.Bill)
                .ThenInclude(b => b.Connection)
                    .ThenInclude(c => c.Consumer)
                        .ThenInclude(co => co.User)
            .AsQueryable();

        if (
            !string.IsNullOrEmpty(paymentMethod)
            && Enum.TryParse<PaymentMethod>(paymentMethod, true, out var method)
        )
        {
            query = query.Where(p => p.PaymentMethod == method);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(p => p.PaymentDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(p => p.PaymentDate <= toDate.Value);
        }

        if (!string.IsNullOrEmpty(paginationParams.SearchTerm))
        {
            var searchTerm = paginationParams.SearchTerm.ToLower();
            query = query.Where(p =>
                p.PaymentNumber.ToLower().Contains(searchTerm)
                || p.Bill.BillNumber.ToLower().Contains(searchTerm)
                || p.Bill.Connection.Consumer.ConsumerNumber.ToLower().Contains(searchTerm)
            );
        }

        var totalRecords = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalRecords / (double)paginationParams.PageSize);

        var payments = await query
            .OrderByDescending(p => p.PaymentDate)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .Select(p => new PaymentListDto
            {
                Id = p.Id,
                PaymentNumber = p.PaymentNumber,
                BillNumber = p.Bill.BillNumber,
                ConsumerName =
                    $"{p.Bill.Connection.Consumer.User.FirstName} {p.Bill.Connection.Consumer.User.LastName}",
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod.ToString(),
                Status = p.Status.ToString(),
            })
            .ToListAsync();

        return new PagedResponse<PaymentListDto>
        {
            Data = payments,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize,
            TotalPages = totalPages,
            TotalRecords = totalRecords,
        };
    }

    public async Task<ApiResponse<PaymentDto>> CreateAsync(CreatePaymentDto dto, int userId)
    {
        var bill = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .FirstOrDefaultAsync(b => b.Id == dto.BillId);

        if (bill == null)
        {
            return ApiResponse<PaymentDto>.ErrorResponse("Bill not found");
        }

        if (bill.Status == BillStatus.Paid)
        {
            return ApiResponse<PaymentDto>.ErrorResponse("Bill is already fully paid");
        }

        if (dto.Amount > bill.OutstandingBalance)
        {
            return ApiResponse<PaymentDto>.ErrorResponse(
                $"Payment amount exceeds outstanding balance ({bill.OutstandingBalance:C})"
            );
        }

        if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out var paymentMethod))
        {
            return ApiResponse<PaymentDto>.ErrorResponse("Invalid payment method");
        }

        var paymentNumber = await GeneratePaymentNumberAsync();

        var payment = new Payment
        {
            PaymentNumber = paymentNumber,
            BillId = dto.BillId,
            Amount = dto.Amount,
            PaymentDate = dto.PaymentDate ?? DateTime.UtcNow,
            PaymentMethod = paymentMethod,
            TransactionReference = dto.TransactionReference,
            Status = PaymentStatus.Completed,
            ReceivedByUserId = userId,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        // Update bill
        bill.AmountPaid += dto.Amount;
        bill.OutstandingBalance -= dto.Amount;

        if (bill.OutstandingBalance <= 0)
        {
            bill.Status = BillStatus.Paid;
            bill.OutstandingBalance = 0;
        }

        bill.UpdatedAt = DateTime.UtcNow;

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Send notification
        await _notificationService.CreatePaymentReceivedNotificationAsync(
            bill.Connection.Consumer.UserId,
            payment.Id,
            payment.Amount
        );

        payment.Bill = bill;
        payment.ReceivedByUser = await _userManager.FindByIdAsync(userId.ToString());

        return ApiResponse<PaymentDto>.SuccessResponse(
            MapToDto(payment),
            "Payment recorded successfully"
        );
    }

    public async Task<ApiResponse<PaymentDto>> UpdateStatusAsync(int id, UpdatePaymentStatusDto dto)
    {
        var payment = await _context
            .Payments.Include(p => p.Bill)
                .ThenInclude(b => b.Connection)
                    .ThenInclude(c => c.Consumer)
                        .ThenInclude(co => co.User)
            .Include(p => p.ReceivedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
        {
            return ApiResponse<PaymentDto>.ErrorResponse("Payment not found");
        }

        if (!Enum.TryParse<PaymentStatus>(dto.Status, true, out var status))
        {
            return ApiResponse<PaymentDto>.ErrorResponse("Invalid status");
        }

        // If refunding, adjust bill amounts
        if (status == PaymentStatus.Refunded && payment.Status == PaymentStatus.Completed)
        {
            var bill = payment.Bill;
            bill.AmountPaid -= payment.Amount;
            bill.OutstandingBalance += payment.Amount;

            if (bill.AmountPaid <= 0)
            {
                bill.Status = BillStatus.Due;
                bill.AmountPaid = 0;
            }

            bill.UpdatedAt = DateTime.UtcNow;
        }

        payment.Status = status;

        await _context.SaveChangesAsync();

        return ApiResponse<PaymentDto>.SuccessResponse(
            MapToDto(payment),
            "Payment status updated successfully"
        );
    }

    public async Task<ApiResponse<PaymentSummaryDto>> GetSummaryAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null
    )
    {
        var query = _context.Payments.Where(p => p.Status == PaymentStatus.Completed);

        if (fromDate.HasValue)
        {
            query = query.Where(p => p.PaymentDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(p => p.PaymentDate <= toDate.Value);
        }

        var payments = await query.ToListAsync();

        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1);

        var summary = new PaymentSummaryDto
        {
            TotalPayments = payments.Count,
            TotalAmount = payments.Sum(p => p.Amount),
            ByPaymentMethod = payments
                .GroupBy(p => p.PaymentMethod.ToString())
                .ToDictionary(g => g.Key, g => g.Sum(p => p.Amount)),
            TodayCollection = payments.Where(p => p.PaymentDate.Date == today).Sum(p => p.Amount),
            ThisMonthCollection = payments
                .Where(p => p.PaymentDate >= startOfMonth)
                .Sum(p => p.Amount),
        };

        return ApiResponse<PaymentSummaryDto>.SuccessResponse(summary);
    }

    private async Task<string> GeneratePaymentNumberAsync()
    {
        var year = DateTime.UtcNow.Year.ToString()[2..];
        var month = DateTime.UtcNow.Month.ToString("D2");

        var lastPayment = await _context
            .Payments.Where(p => p.PaymentNumber.StartsWith($"PAY{year}{month}"))
            .OrderByDescending(p => p.PaymentNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastPayment != null)
        {
            var lastNumber = lastPayment.PaymentNumber[7..];
            if (int.TryParse(lastNumber, out int num))
            {
                nextNumber = num + 1;
            }
        }

        return $"PAY{year}{month}{nextNumber:D6}";
    }

    private static PaymentDto MapToDto(Payment payment)
    {
        return new PaymentDto
        {
            Id = payment.Id,
            PaymentNumber = payment.PaymentNumber,
            BillId = payment.BillId,
            BillNumber = payment.Bill.BillNumber,
            ConsumerName =
                $"{payment.Bill.Connection.Consumer.User.FirstName} {payment.Bill.Connection.Consumer.User.LastName}",
            ConsumerNumber = payment.Bill.Connection.Consumer.ConsumerNumber,
            Amount = payment.Amount,
            PaymentDate = DateTime.SpecifyKind(payment.PaymentDate, DateTimeKind.Utc).ToLocalTime(),
            PaymentMethod = payment.PaymentMethod.ToString(),
            TransactionReference = payment.TransactionReference,
            Status = payment.Status.ToString(),
            ReceivedByUserName =
                payment.ReceivedByUser != null
                    ? $"{payment.ReceivedByUser.FirstName} {payment.ReceivedByUser.LastName}"
                    : null,
            Notes = payment.Notes,
            CreatedAt = DateTime.SpecifyKind(payment.CreatedAt, DateTimeKind.Utc).ToLocalTime(),
        };
    }
}
