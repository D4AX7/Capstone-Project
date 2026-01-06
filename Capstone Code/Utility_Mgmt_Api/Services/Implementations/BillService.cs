using System.Globalization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Bill;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class BillService : IBillService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;

    public BillService(
        ApplicationDbContext context,
        INotificationService notificationService,
        UserManager<ApplicationUser> userManager
    )
    {
        _context = context;
        _notificationService = notificationService;
        _userManager = userManager;
    }

    public async Task<ApiResponse<BillDto>> GetByIdAsync(int id)
    {
        var bill = await GetBillWithDetailsAsync(id);
        if (bill == null)
        {
            return ApiResponse<BillDto>.ErrorResponse("Bill not found");
        }

        return ApiResponse<BillDto>.SuccessResponse(MapToDto(bill));
    }

    public async Task<ApiResponse<BillDto>> GetByBillNumberAsync(string billNumber)
    {
        var bill = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(b => b.Connection)
                .ThenInclude(c => c.TariffPlan)
            .Include(b => b.Payment)
            .Include(b => b.GeneratedByUser)
            .FirstOrDefaultAsync(b => b.BillNumber == billNumber);

        if (bill == null)
        {
            return ApiResponse<BillDto>.ErrorResponse("Bill not found");
        }

        return ApiResponse<BillDto>.SuccessResponse(MapToDto(bill));
    }

    public async Task<ApiResponse<List<BillDto>>> GetByConnectionIdAsync(int connectionId)
    {
        var bills = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(b => b.Connection)
                .ThenInclude(c => c.TariffPlan)
            .Include(b => b.Payment)
            .Where(b => b.ConnectionId == connectionId)
            .OrderByDescending(b => b.BillingYear)
            .ThenByDescending(b => b.BillingMonth)
            .ToListAsync();

        return ApiResponse<List<BillDto>>.SuccessResponse(bills.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<List<BillDto>>> GetByConsumerIdAsync(int consumerId)
    {
        var bills = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(b => b.Connection)
                .ThenInclude(c => c.TariffPlan)
            .Include(b => b.Payment)
            .Where(b => b.Connection.ConsumerId == consumerId)
            .OrderByDescending(b => b.BillingYear)
            .ThenByDescending(b => b.BillingMonth)
            .ToListAsync();

        return ApiResponse<List<BillDto>>.SuccessResponse(bills.Select(MapToDto).ToList());
    }

    public async Task<PagedResponse<BillListDto>> GetAllAsync(
        PaginationParams paginationParams,
        string? status = null,
        int? billingMonth = null,
        int? billingYear = null
    )
    {
        // Update any bills that have become overdue
        await UpdateOverdueBillsAsync();

        var query = _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .AsQueryable();

        if (
            !string.IsNullOrEmpty(status)
            && Enum.TryParse<BillStatus>(status, true, out var statusEnum)
        )
        {
            query = query.Where(b => b.Status == statusEnum);
        }

        if (billingMonth.HasValue)
        {
            query = query.Where(b => b.BillingMonth == billingMonth.Value);
        }

        if (billingYear.HasValue)
        {
            query = query.Where(b => b.BillingYear == billingYear.Value);
        }

        if (!string.IsNullOrEmpty(paginationParams.SearchTerm))
        {
            var searchTerm = paginationParams.SearchTerm.ToLower();
            query = query.Where(b =>
                b.BillNumber.ToLower().Contains(searchTerm)
                || b.Connection.Consumer.ConsumerNumber.ToLower().Contains(searchTerm)
                || b.Connection.Consumer.User.FirstName.ToLower().Contains(searchTerm)
                || b.Connection.Consumer.User.LastName.ToLower().Contains(searchTerm)
            );
        }

        var totalRecords = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalRecords / (double)paginationParams.PageSize);

        var bills = await query
            .OrderByDescending(b => b.BillingYear)
            .ThenByDescending(b => b.BillingMonth)
            .ThenByDescending(b => b.CreatedAt)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .Select(b => new BillListDto
            {
                Id = b.Id,
                BillNumber = b.BillNumber,
                ConsumerName =
                    $"{b.Connection.Consumer.User.FirstName} {b.Connection.Consumer.User.LastName}",
                ConsumerNumber = b.Connection.Consumer.ConsumerNumber,
                UtilityType = b.Connection.UtilityType.Name,
                BillingPeriod =
                    $"{CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(b.BillingMonth)} {b.BillingYear}",
                DueDate = b.DueDate,
                DueAmount = b.TotalAmount - b.PenaltyAmount,
                PenaltyAmount = b.PenaltyAmount,
                TotalAmount = b.TotalAmount,
                OutstandingBalance = b.OutstandingBalance,
                Status = b.Status.ToString(),
            })
            .ToListAsync();

        return new PagedResponse<BillListDto>
        {
            Data = bills,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize,
            TotalPages = totalPages,
            TotalRecords = totalRecords,
        };
    }

    public async Task<ApiResponse<BillDto>> GenerateBillAsync(GenerateBillDto dto, int userId)
    {
        var connection = await _context
            .Connections.Include(c => c.Consumer)
                .ThenInclude(co => co.User)
            .Include(c => c.UtilityType)
            .Include(c => c.TariffPlan)
            .FirstOrDefaultAsync(c => c.Id == dto.ConnectionId);

        if (connection == null)
        {
            return ApiResponse<BillDto>.ErrorResponse("Connection not found");
        }

        if (connection.Status != ConnectionStatus.Active)
        {
            return ApiResponse<BillDto>.ErrorResponse("Connection is not active");
        }

        // Check if bill already exists
        if (
            await _context.Bills.AnyAsync(b =>
                b.ConnectionId == dto.ConnectionId
                && b.BillingMonth == dto.BillingMonth
                && b.BillingYear == dto.BillingYear
            )
        )
        {
            return ApiResponse<BillDto>.ErrorResponse(
                "Bill already exists for this billing period"
            );
        }

        // Get meter reading
        MeterReading? meterReading = null;
        if (dto.MeterReadingId.HasValue)
        {
            meterReading = await _context.MeterReadings.FindAsync(dto.MeterReadingId.Value);
        }
        else
        {
            meterReading = await _context.MeterReadings.FirstOrDefaultAsync(m =>
                m.ConnectionId == dto.ConnectionId
                && m.BillingMonth == dto.BillingMonth
                && m.BillingYear == dto.BillingYear
            );
        }

        if (meterReading == null)
        {
            return ApiResponse<BillDto>.ErrorResponse(
                "Meter reading not found for this billing period"
            );
        }

        // Get billing cycle to determine due date
        var billingCycle = await _context.BillingCycles.FirstOrDefaultAsync(bc =>
            bc.Month == dto.BillingMonth && bc.Year == dto.BillingYear
        );

        // Get previous balance (for reference only, not added to this bill's total)
        var previousBalance = await GetPreviousBalanceAsync(dto.ConnectionId);

        // Calculate bill - each bill only includes its own charges, NOT previous balance
        // Previous bills' outstanding amounts are tracked separately
        var tariff = connection.TariffPlan;
        var energyCharges = meterReading.UnitsConsumed * tariff.RatePerUnit;
        var fixedCharges = tariff.FixedCharges;
        var subtotal = energyCharges + fixedCharges;
        var taxAmount = subtotal * (tariff.TaxPercentage / 100);
        var totalAmount = subtotal + taxAmount; // Don't add previousBalance - keep bills separate

        var billNumber = await GenerateBillNumberAsync();

        // Bill date is set to the meter reading date
        var billDate = DateOnly.FromDateTime(meterReading.ReadingDate);

        // Due date is 7 days after bill generation date
        var dueDate = billDate.AddDays(7);

        var bill = new Bill
        {
            BillNumber = billNumber,
            ConnectionId = dto.ConnectionId,
            MeterReadingId = meterReading.Id,
            BillingMonth = dto.BillingMonth,
            BillingYear = dto.BillingYear,
            BillDate = billDate,
            DueDate = dueDate,
            PreviousReading = meterReading.PreviousReading,
            CurrentReading = meterReading.CurrentReading,
            UnitsConsumed = meterReading.UnitsConsumed,
            RatePerUnit = tariff.RatePerUnit,
            EnergyCharges = energyCharges,
            FixedCharges = fixedCharges,
            TaxAmount = taxAmount,
            PenaltyAmount = 0,
            PreviousBalance = previousBalance,
            TotalAmount = totalAmount,
            AmountPaid = 0,
            OutstandingBalance = totalAmount,
            Status = BillStatus.Due,
            GeneratedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Bills.Add(bill);
        await _context.SaveChangesAsync();

        // Send notification to consumer
        await _notificationService.CreateBillGeneratedNotificationAsync(
            connection.Consumer.UserId,
            bill.Id,
            bill.BillNumber,
            bill.TotalAmount
        );

        bill.Connection = connection;
        bill.GeneratedByUser = await _userManager.FindByIdAsync(userId.ToString());

        return ApiResponse<BillDto>.SuccessResponse(MapToDto(bill), "Bill generated successfully");
    }

    public async Task<ApiResponse<List<BillDto>>> GenerateBulkBillsAsync(
        GenerateBulkBillsDto dto,
        int userId
    )
    {
        var generatedBills = new List<BillDto>();
        var errors = new List<string>();

        List<int> connectionIds;
        if (dto.ConnectionIds != null && dto.ConnectionIds.Any())
        {
            connectionIds = dto.ConnectionIds;
        }
        else
        {
            // Get all meter reading IDs that already have bills generated
            var billedMeterReadingIds = await _context
                .Bills.Where(b => b.MeterReadingId.HasValue)
                .Select(b => b.MeterReadingId!.Value)
                .ToListAsync();

            // Find unbilled meter readings for the specified period
            connectionIds = await _context
                .MeterReadings.Where(m =>
                    m.BillingMonth == dto.BillingMonth
                    && m.BillingYear == dto.BillingYear
                    && !billedMeterReadingIds.Contains(m.Id)
                )
                .Select(m => m.ConnectionId)
                .Distinct()
                .ToListAsync();
        }

        if (!connectionIds.Any())
        {
            return ApiResponse<List<BillDto>>.SuccessResponse(
                generatedBills,
                $"No unbilled meter readings found for {dto.BillingMonth}/{dto.BillingYear}. Please ensure meter readings are recorded for this billing period first."
            );
        }

        foreach (var connectionId in connectionIds)
        {
            var generateDto = new GenerateBillDto
            {
                ConnectionId = connectionId,
                BillingMonth = dto.BillingMonth,
                BillingYear = dto.BillingYear,
            };

            var result = await GenerateBillAsync(generateDto, userId);
            if (result.Success && result.Data != null)
            {
                generatedBills.Add(result.Data);
            }
            else
            {
                errors.Add($"Connection {connectionId}: {result.Message}");
            }
        }

        if (errors.Any())
        {
            return ApiResponse<List<BillDto>>.ErrorResponse(
                $"Generated {generatedBills.Count} bills with {errors.Count} errors",
                errors
            );
        }

        return ApiResponse<List<BillDto>>.SuccessResponse(
            generatedBills,
            $"Generated {generatedBills.Count} bills successfully"
        );
    }

    public async Task<ApiResponse<BillDto>> UpdateStatusAsync(int id, UpdateBillStatusDto dto)
    {
        var bill = await GetBillWithDetailsAsync(id);
        if (bill == null)
        {
            return ApiResponse<BillDto>.ErrorResponse("Bill not found");
        }

        if (!Enum.TryParse<BillStatus>(dto.Status, true, out var status))
        {
            return ApiResponse<BillDto>.ErrorResponse("Invalid status");
        }

        bill.Status = status;
        bill.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<BillDto>.SuccessResponse(
            MapToDto(bill),
            "Bill status updated successfully"
        );
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var bill = await _context
            .Bills.Include(b => b.Payment)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bill == null)
        {
            return ApiResponse<bool>.ErrorResponse("Bill not found");
        }

        if (bill.Payment != null)
        {
            return ApiResponse<bool>.ErrorResponse("Cannot delete bill with payments");
        }

        _context.Bills.Remove(bill);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Bill deleted successfully");
    }

    public async Task<ApiResponse<BillSummaryDto>> GetSummaryAsync(
        int? billingMonth = null,
        int? billingYear = null
    )
    {
        var query = _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.TariffPlan)
            .AsQueryable();

        if (billingMonth.HasValue)
        {
            query = query.Where(b => b.BillingMonth == billingMonth.Value);
        }

        if (billingYear.HasValue)
        {
            query = query.Where(b => b.BillingYear == billingYear.Value);
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var bills = await query.ToListAsync();

        var summary = new BillSummaryDto
        {
            TotalBills = bills.Count,
            TotalBilledAmount = bills.Sum(b => b.TotalAmount),
            TotalCollected = bills.Sum(b => b.AmountPaid),
            TotalOutstanding = bills.Sum(b =>
                b.OutstandingBalance
                + (
                    b.PenaltyAmount > 0
                        ? b.PenaltyAmount
                        : (b.DueDate < today ? b.Connection.TariffPlan?.LatePaymentPenalty ?? 0 : 0)
                )
            ),
            PaidBills = bills.Count(b => b.Status == BillStatus.Paid),
            OverdueBills = bills.Count(b =>
                b.Status == BillStatus.Overdue || (b.DueDate < today && b.OutstandingBalance > 0)
            ),
        };

        return ApiResponse<BillSummaryDto>.SuccessResponse(summary);
    }

    public async Task<ApiResponse<List<BillListDto>>> GetOverdueBillsAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var bills = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .Where(b =>
                b.DueDate < today && b.OutstandingBalance > 0 && b.Status != BillStatus.Paid
            )
            .OrderBy(b => b.DueDate)
            .Select(b => new BillListDto
            {
                Id = b.Id,
                BillNumber = b.BillNumber,
                ConsumerName =
                    $"{b.Connection.Consumer.User.FirstName} {b.Connection.Consumer.User.LastName}",
                ConsumerNumber = b.Connection.Consumer.ConsumerNumber,
                UtilityType = b.Connection.UtilityType.Name,
                BillingPeriod =
                    $"{CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(b.BillingMonth)} {b.BillingYear}",
                DueDate = b.DueDate,
                DueAmount = b.TotalAmount - b.PenaltyAmount,
                PenaltyAmount = b.PenaltyAmount,
                TotalAmount = b.TotalAmount,
                OutstandingBalance = b.OutstandingBalance,
                Status = b.Status.ToString(),
            })
            .ToListAsync();

        return ApiResponse<List<BillListDto>>.SuccessResponse(bills);
    }

    public async Task UpdateOverdueBillsAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTime.UtcNow;

        // Penalty interval in days - penalty increases every 7 days of being overdue
        const int penaltyIntervalDays = 7;

        // Get all unpaid bills that are past due date
        var overdueBills = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.TariffPlan)
            .Where(b =>
                b.DueDate < today && b.OutstandingBalance > 0 && b.Status != BillStatus.Paid
            )
            .ToListAsync();

        foreach (var bill in overdueBills)
        {
            var connection = bill.Connection;
            if (connection?.TariffPlan == null)
                continue;

            var basePenalty = connection.TariffPlan.LatePaymentPenalty;
            if (basePenalty <= 0)
                continue;

            // Calculate days since due date
            var daysSinceDue = today.DayNumber - bill.DueDate.DayNumber;

            // Calculate how many penalty intervals have passed since due date
            // First penalty at day 1 (immediately overdue), then every 7 days after
            // Day 1-7: 1 penalty, Day 8-14: 2 penalties, Day 15-21: 3 penalties, etc.
            var totalPenaltiesExpected = 1 + (daysSinceDue / penaltyIntervalDays);

            // Calculate current number of penalties based on existing penalty amount
            var currentPenaltyCount = (int)(bill.PenaltyAmount / basePenalty);

            // Mark as overdue if not already
            if (bill.Status != BillStatus.Overdue)
            {
                bill.Status = BillStatus.Overdue;
            }

            // Apply additional penalties if needed
            if (totalPenaltiesExpected > currentPenaltyCount)
            {
                var additionalPenalties = totalPenaltiesExpected - currentPenaltyCount;
                var additionalPenaltyAmount = basePenalty * additionalPenalties;

                bill.PenaltyAmount += additionalPenaltyAmount;
                bill.TotalAmount += additionalPenaltyAmount;
                bill.OutstandingBalance += additionalPenaltyAmount;
                bill.LastPenaltyAppliedAt = now;
            }

            bill.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();
    }

    private async Task<Bill?> GetBillWithDetailsAsync(int id)
    {
        return await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(b => b.Connection)
                .ThenInclude(c => c.TariffPlan)
            .Include(b => b.Payment)
            .Include(b => b.GeneratedByUser)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    private async Task<decimal> GetPreviousBalanceAsync(int connectionId)
    {
        var lastBill = await _context
            .Bills.Where(b => b.ConnectionId == connectionId)
            .OrderByDescending(b => b.BillingYear)
            .ThenByDescending(b => b.BillingMonth)
            .FirstOrDefaultAsync();

        return lastBill?.OutstandingBalance ?? 0;
    }

    private async Task<string> GenerateBillNumberAsync()
    {
        var year = DateTime.UtcNow.Year.ToString()[2..];
        var month = DateTime.UtcNow.Month.ToString("D2");

        var lastBill = await _context
            .Bills.Where(b => b.BillNumber.StartsWith($"BILL{year}{month}"))
            .OrderByDescending(b => b.BillNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastBill != null)
        {
            var lastNumber = lastBill.BillNumber[8..];
            if (int.TryParse(lastNumber, out int num))
            {
                nextNumber = num + 1;
            }
        }

        return $"BILL{year}{month}{nextNumber:D6}";
    }

    private static BillDto MapToDto(Bill bill)
    {
        return new BillDto
        {
            Id = bill.Id,
            BillNumber = bill.BillNumber,
            ConnectionId = bill.ConnectionId,
            ConnectionNumber = bill.Connection.ConnectionNumber,
            MeterNumber = bill.Connection.MeterNumber,
            ConsumerName =
                $"{bill.Connection.Consumer.User.FirstName} {bill.Connection.Consumer.User.LastName}",
            ConsumerNumber = bill.Connection.Consumer.ConsumerNumber,
            UtilityType = bill.Connection.UtilityType.Name,
            TariffPlan = bill.Connection.TariffPlan.Name,
            BillingMonth = bill.BillingMonth,
            BillingYear = bill.BillingYear,
            BillingPeriod =
                $"{CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(bill.BillingMonth)} {bill.BillingYear}",
            BillDate = bill.BillDate,
            DueDate = bill.DueDate,
            PreviousReading = bill.PreviousReading,
            CurrentReading = bill.CurrentReading,
            UnitsConsumed = bill.UnitsConsumed,
            RatePerUnit = bill.RatePerUnit,
            EnergyCharges = bill.EnergyCharges,
            FixedCharges = bill.FixedCharges,
            TaxAmount = bill.TaxAmount,
            PenaltyAmount = bill.PenaltyAmount,
            PenaltyCount =
                bill.Connection.TariffPlan.LatePaymentPenalty > 0
                    ? (int)(bill.PenaltyAmount / bill.Connection.TariffPlan.LatePaymentPenalty)
                    : 0,
            BasePenaltyAmount = bill.Connection.TariffPlan.LatePaymentPenalty,
            PreviousBalance = bill.PreviousBalance,
            TotalAmount = bill.TotalAmount,
            AmountPaid = bill.AmountPaid,
            OutstandingBalance = bill.OutstandingBalance,
            Status = bill.Status.ToString(),
            GeneratedByUserName =
                bill.GeneratedByUser != null
                    ? $"{bill.GeneratedByUser.FirstName} {bill.GeneratedByUser.LastName}"
                    : null,
            CreatedAt = DateTime.SpecifyKind(bill.CreatedAt, DateTimeKind.Utc).ToLocalTime(),
            Payment = bill.Payment != null
                ? new PaymentSummaryDto
                {
                    Id = bill.Payment.Id,
                    PaymentNumber = bill.Payment.PaymentNumber,
                    Amount = bill.Payment.Amount,
                    PaymentDate = DateTime
                            .SpecifyKind(bill.Payment.PaymentDate, DateTimeKind.Utc)
                            .ToLocalTime(),
                    PaymentMethod = bill.Payment.PaymentMethod.ToString(),
                    Status = bill.Payment.Status.ToString(),
                }
                : null,
        };
    }
}
