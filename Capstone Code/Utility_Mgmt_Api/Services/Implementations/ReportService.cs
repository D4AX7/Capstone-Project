using System.Globalization;
using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Reports;
using UtilityManagmentApi.Entities;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Services.Implementations;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<DashboardSummaryDto>> GetDashboardSummaryAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentMonth = DateTime.UtcNow.Month;
        var currentYear = DateTime.UtcNow.Year;

        var totalConsumers = await _context.Consumers.CountAsync(c => c.IsActive);
        var activeConnections = await _context.Connections.CountAsync(c =>
            c.Status == ConnectionStatus.Active
        );
        var totalBills = await _context.Bills.CountAsync();
        var pendingBills = await _context.Bills.CountAsync(b =>
            b.Status != BillStatus.Paid && b.DueDate >= today
        );
        var overdueBills = await _context.Bills.CountAsync(b =>
            b.Status == BillStatus.Overdue || (b.DueDate < today && b.OutstandingBalance > 0)
        );

        var revenueThisMonth = await _context
            .Payments.Where(p =>
                p.PaymentDate.Month == currentMonth
                && p.PaymentDate.Year == currentYear
                && p.Status == PaymentStatus.Completed
            )
            .SumAsync(p => p.Amount);

        // Calculate total outstanding - penalties are already included in OutstandingBalance
        var totalOutstanding = await _context
            .Bills.Where(b => b.OutstandingBalance > 0)
            .SumAsync(b => b.OutstandingBalance);

        // Recent activities
        var recentBillsData = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .OrderByDescending(b => b.CreatedAt)
            .Take(5)
            .Select(b => new
            {
                b.BillNumber,
                ConsumerName = $"{b.Connection.Consumer.User.FirstName} {b.Connection.Consumer.User.LastName}",
                b.CreatedAt,
            })
            .ToListAsync();

        var recentBills = recentBillsData
            .Select(b => new RecentActivityDto
            {
                Type = "Bill Generated",
                Description = $"Bill {b.BillNumber} generated for {b.ConsumerName}",
                Timestamp = DateTime.SpecifyKind(b.CreatedAt, DateTimeKind.Utc).ToLocalTime(),
            })
            .ToList();

        var recentPaymentsData = await _context
            .Payments.Include(p => p.Bill)
                .ThenInclude(b => b.Connection)
                    .ThenInclude(c => c.Consumer)
                        .ThenInclude(co => co.User)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .Select(p => new
            {
                p.Amount,
                ConsumerName = $"{p.Bill.Connection.Consumer.User.FirstName} {p.Bill.Connection.Consumer.User.LastName}",
                p.CreatedAt,
            })
            .ToListAsync();

        var recentPayments = recentPaymentsData
            .Select(p => new RecentActivityDto
            {
                Type = "Payment Received",
                Description = $"Payment of ₹{p.Amount:F2} received from {p.ConsumerName}",
                Timestamp = DateTime.SpecifyKind(p.CreatedAt, DateTimeKind.Utc).ToLocalTime(),
            })
            .ToList();

        var recentActivities = recentBills
            .Concat(recentPayments)
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .ToList();

        // Consumption by utility type - total consumption across all time
        // First get all utility types to ensure all are shown
        var allUtilityTypes = await _context
            .UtilityTypes.Select(u => new { u.Name, u.UnitOfMeasurement })
            .ToListAsync();

        // Get meter readings with their utility types
        var meterReadingsWithUtility = await _context
            .MeterReadings.Include(m => m.Connection)
                .ThenInclude(c => c.UtilityType)
            .Select(m => new
            {
                UtilityTypeName = m.Connection.UtilityType.Name,
                Unit = m.Connection.UtilityType.UnitOfMeasurement,
                m.UnitsConsumed,
                m.ConnectionId,
            })
            .ToListAsync();

        // Group consumption by utility type
        var consumptionGroups = meterReadingsWithUtility
            .GroupBy(m => new { m.UtilityTypeName, m.Unit })
            .ToDictionary(
                g => g.Key.UtilityTypeName,
                g => new
                {
                    TotalConsumption = g.Sum(m => m.UnitsConsumed),
                    ConnectionCount = g.Select(m => m.ConnectionId).Distinct().Count(),
                    Unit = g.Key.Unit,
                }
            );

        // Build consumption list including all utility types (even with 0 consumption)
        var consumptionByType = allUtilityTypes
            .Select(u => new UtilityConsumptionDto
            {
                UtilityType = u.Name,
                TotalConsumption = consumptionGroups.ContainsKey(u.Name)
                    ? consumptionGroups[u.Name].TotalConsumption
                    : 0,
                Unit = u.UnitOfMeasurement,
                ConnectionCount = consumptionGroups.ContainsKey(u.Name)
                    ? consumptionGroups[u.Name].ConnectionCount
                    : 0,
            })
            .ToList();

        // Revenue by utility type - get all bills with their utility types
        var billsWithUtility = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(b => b.Payment)
            .Select(b => new
            {
                UtilityTypeName = b.Connection.UtilityType.Name,
                b.TotalAmount,
                CollectedAmount = b.Payment != null && b.Payment.Status == PaymentStatus.Completed
                    ? b.Payment.Amount
                    : 0m,
            })
            .ToListAsync();

        // Group revenue by utility type
        var revenueGroups = billsWithUtility
            .GroupBy(b => b.UtilityTypeName)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Billed = g.Sum(b => b.TotalAmount),
                    Collected = g.Sum(b => b.CollectedAmount),
                }
            );

        // Build revenue list including all utility types
        var revenueByType = allUtilityTypes
            .Select(u => new UtilityRevenueDto
            {
                UtilityType = u.Name,
                BilledAmount = revenueGroups.ContainsKey(u.Name) ? revenueGroups[u.Name].Billed : 0,
                Collected = revenueGroups.ContainsKey(u.Name) ? revenueGroups[u.Name].Collected : 0,
                BillCount = billsWithUtility.Count(b => b.UtilityTypeName == u.Name),
            })
            .ToList();

        // Calculate totals
        var totalBilled = billsWithUtility.Sum(b => b.TotalAmount);
        var totalCollected = billsWithUtility.Sum(b => b.CollectedAmount);

        var summary = new DashboardSummaryDto
        {
            TotalConsumers = totalConsumers,
            ActiveConnections = activeConnections,
            TotalBills = totalBills,
            PendingBills = pendingBills,
            OverdueBills = overdueBills,
            TotalRevenueThisMonth = revenueThisMonth,
            TotalOutstanding = totalOutstanding,
            TotalBilled = totalBilled,
            TotalCollected = totalCollected,
            RecentActivities = recentActivities,
            ConsumptionByUtilityType = consumptionByType,
            RevenueByUtilityType = revenueByType,
        };

        return ApiResponse<DashboardSummaryDto>.SuccessResponse(summary);
    }

    public async Task<ApiResponse<MonthlyRevenueReportDto>> GetMonthlyRevenueReportAsync(
        int month,
        int year
    )
    {
        var bills = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .Include(b => b.Connection)
                .ThenInclude(c => c.TariffPlan)
            .Where(b => b.BillingMonth == month && b.BillingYear == year)
            .ToListAsync();

        var payments = await _context
            .Payments.Include(p => p.Bill)
                .ThenInclude(b => b.Connection)
                    .ThenInclude(c => c.UtilityType)
            .Where(p =>
                p.Bill.BillingMonth == month
                && p.Bill.BillingYear == year
                && p.Status == PaymentStatus.Completed
            )
            .ToListAsync();

        var byUtilityType = bills
            .GroupBy(b => b.Connection.UtilityType.Name)
            .Select(g => new UtilityRevenueDto
            {
                UtilityType = g.Key,
                BilledAmount = g.Sum(b => b.TotalAmount),
                Collected = payments
                    .Where(p => p.Bill.Connection.UtilityType.Name == g.Key)
                    .Sum(p => p.Amount),
                BillCount = g.Count(),
            })
            .ToList();

        var totalBilled = bills.Sum(b => b.TotalAmount);
        var totalCollected = payments.Sum(p => p.Amount);

        // Calculate outstanding with penalties for overdue bills
        var todayForReport = DateOnly.FromDateTime(DateTime.UtcNow);
        var totalOutstandingWithPenalties = bills.Sum(b =>
            b.OutstandingBalance
            + (
                b.PenaltyAmount > 0
                    ? b.PenaltyAmount
                    : (
                        b.DueDate < todayForReport
                            ? b.Connection.TariffPlan?.LatePaymentPenalty ?? 0
                            : 0
                    )
            )
        );

        var report = new MonthlyRevenueReportDto
        {
            Month = month,
            Year = year,
            MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
            TotalBilledAmount = totalBilled,
            TotalCollected = totalCollected,
            TotalOutstanding = totalOutstandingWithPenalties,
            TotalBills = bills.Count,
            PaidBills = bills.Count(b => b.Status == BillStatus.Paid),
            CollectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
            ByUtilityType = byUtilityType,
        };

        return ApiResponse<MonthlyRevenueReportDto>.SuccessResponse(report);
    }

    public async Task<ApiResponse<List<MonthlyRevenueReportDto>>> GetYearlyRevenueReportAsync(
        int year
    )
    {
        var reports = new List<MonthlyRevenueReportDto>();

        for (int month = 1; month <= 12; month++)
        {
            var result = await GetMonthlyRevenueReportAsync(month, year);
            if (result.Success && result.Data != null)
            {
                reports.Add(result.Data);
            }
        }

        return ApiResponse<List<MonthlyRevenueReportDto>>.SuccessResponse(reports);
    }

    public async Task<ApiResponse<OutstandingDuesReportDto>> GetOutstandingDuesReportAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var outstandingBills = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(b => b.Connection)
                .ThenInclude(c => c.TariffPlan)
            .Where(b => b.OutstandingBalance > 0)
            .ToListAsync();

        // Age buckets - calculate days difference using DayNumber
        var ageBuckets = new List<OutstandingByAgeDto>
        {
            new OutstandingByAgeDto
            {
                AgeBucket = "Current (0-30 days)",
                Amount = outstandingBills
                    .Where(b => today.DayNumber - b.DueDate.DayNumber <= 30)
                    .Sum(b => b.OutstandingBalance),
                Count = outstandingBills.Count(b => today.DayNumber - b.DueDate.DayNumber <= 30),
            },
            new OutstandingByAgeDto
            {
                AgeBucket = "31-60 days",
                Amount = outstandingBills
                    .Where(b =>
                        today.DayNumber - b.DueDate.DayNumber > 30
                        && today.DayNumber - b.DueDate.DayNumber <= 60
                    )
                    .Sum(b => b.OutstandingBalance),
                Count = outstandingBills.Count(b =>
                    today.DayNumber - b.DueDate.DayNumber > 30
                    && today.DayNumber - b.DueDate.DayNumber <= 60
                ),
            },
            new OutstandingByAgeDto
            {
                AgeBucket = "61-90 days",
                Amount = outstandingBills
                    .Where(b =>
                        today.DayNumber - b.DueDate.DayNumber > 60
                        && today.DayNumber - b.DueDate.DayNumber <= 90
                    )
                    .Sum(b => b.OutstandingBalance),
                Count = outstandingBills.Count(b =>
                    today.DayNumber - b.DueDate.DayNumber > 60
                    && today.DayNumber - b.DueDate.DayNumber <= 90
                ),
            },
            new OutstandingByAgeDto
            {
                AgeBucket = "Over 90 days",
                Amount = outstandingBills
                    .Where(b => today.DayNumber - b.DueDate.DayNumber > 90)
                    .Sum(b => b.OutstandingBalance),
                Count = outstandingBills.Count(b => today.DayNumber - b.DueDate.DayNumber > 90),
            },
        };

        // Top defaulters - penalties are already included in OutstandingBalance
        var topDefaulters = outstandingBills
            .GroupBy(b => new
            {
                b.Connection.ConsumerId,
                b.Connection.Consumer.ConsumerNumber,
                ConsumerName = $"{b.Connection.Consumer.User.FirstName} {b.Connection.Consumer.User.LastName}",
            })
            .Select(g => new ConsumerOutstandingDto
            {
                ConsumerId = g.Key.ConsumerId,
                ConsumerNumber = g.Key.ConsumerNumber,
                ConsumerName = g.Key.ConsumerName,
                // PenaltyAmount is the sum of all penalties applied to bills
                PenaltyAmount = g.Sum(b => b.PenaltyAmount),
                // DueAmount is the original bill amount without penalties
                DueAmount = g.Sum(b => b.OutstandingBalance - b.PenaltyAmount),
                // OutstandingAmount is the total including penalties (already in OutstandingBalance)
                OutstandingAmount = g.Sum(b => b.OutstandingBalance),
                OverdueBills = g.Count(b => b.DueDate < today),
                OldestDueDate = g.Min(b => b.DueDate),
            })
            .OrderByDescending(d => d.OutstandingAmount)
            .Take(10)
            .ToList();

        // Total outstanding already includes penalties in OutstandingBalance
        var totalOutstandingWithPenalty = outstandingBills.Sum(b => b.OutstandingBalance);

        var report = new OutstandingDuesReportDto
        {
            TotalOutstanding = totalOutstandingWithPenalty,
            // Only count consumers who have at least one overdue bill (DueDate < today)
            TotalOverdueAccounts = outstandingBills
                .Where(b => b.DueDate < today)
                .Select(b => b.Connection.ConsumerId)
                .Distinct()
                .Count(),
            ByAgeBucket = ageBuckets,
            TopDefaulters = topDefaulters,
        };

        return ApiResponse<OutstandingDuesReportDto>.SuccessResponse(report);
    }

    public async Task<ApiResponse<ConsumptionReportDto>> GetConsumptionReportAsync(
        int month,
        int year
    )
    {
        var readings = await _context
            .MeterReadings.Include(m => m.Connection)
                .ThenInclude(c => c.Consumer)
                    .ThenInclude(co => co.User)
            .Include(m => m.Connection)
                .ThenInclude(c => c.UtilityType)
            .Where(m => m.BillingMonth == month && m.BillingYear == year)
            .ToListAsync();

        var byUtilityType = readings
            .GroupBy(m => new
            {
                m.Connection.UtilityType.Name,
                m.Connection.UtilityType.UnitOfMeasurement,
            })
            .Select(g => new UtilityConsumptionDetailDto
            {
                UtilityType = g.Key.Name,
                Unit = g.Key.UnitOfMeasurement,
                TotalConsumption = g.Sum(m => m.UnitsConsumed),
                AverageConsumption = g.Average(m => m.UnitsConsumed),
                MinConsumption = g.Min(m => m.UnitsConsumed),
                MaxConsumption = g.Max(m => m.UnitsConsumed),
                ConnectionCount = g.Count(),
            })
            .ToList();

        var topConsumers = readings
            .OrderByDescending(m => m.UnitsConsumed)
            .Take(10)
            .Select(m => new TopConsumerDto
            {
                ConsumerId = m.Connection.ConsumerId,
                ConsumerNumber = m.Connection.Consumer.ConsumerNumber,
                ConsumerName =
                    $"{m.Connection.Consumer.User.FirstName} {m.Connection.Consumer.User.LastName}",
                UtilityType = m.Connection.UtilityType.Name,
                Consumption = m.UnitsConsumed,
                Unit = m.Connection.UtilityType.UnitOfMeasurement,
            })
            .ToList();

        var report = new ConsumptionReportDto
        {
            Month = month,
            Year = year,
            ByUtilityType = byUtilityType,
            TopConsumers = topConsumers,
            TotalConsumption = readings.Sum(m => m.UnitsConsumed),
            AverageConsumption = readings.Any() ? readings.Average(m => m.UnitsConsumed) : 0,
        };

        return ApiResponse<ConsumptionReportDto>.SuccessResponse(report);
    }

    public async Task<ApiResponse<ConsumerBillingSummaryDto>> GetConsumerBillingSummaryAsync(
        int consumerId
    )
    {
        var consumer = await _context
            .Consumers.Include(c => c.User)
            .Include(c => c.Connections)
                .ThenInclude(conn => conn.UtilityType)
            .FirstOrDefaultAsync(c => c.Id == consumerId);

        if (consumer == null)
        {
            return ApiResponse<ConsumerBillingSummaryDto>.ErrorResponse("Consumer not found");
        }

        var bills = await _context
            .Bills.Include(b => b.Connection)
                .ThenInclude(c => c.UtilityType)
            .Where(b => b.Connection.ConsumerId == consumerId)
            .ToListAsync();

        var readings = await _context
            .MeterReadings.Where(m => m.Connection.ConsumerId == consumerId)
            .ToListAsync();

        var connectionSummaries = consumer
            .Connections.Select(conn => new ConnectionBillingSummaryDto
            {
                ConnectionId = conn.Id,
                ConnectionNumber = conn.ConnectionNumber,
                UtilityType = conn.UtilityType.Name,
                BillCount = bills.Count(b => b.ConnectionId == conn.Id),
                TotalBilled = bills.Where(b => b.ConnectionId == conn.Id).Sum(b => b.TotalAmount),
                TotalPaid = bills.Where(b => b.ConnectionId == conn.Id).Sum(b => b.AmountPaid),
                Outstanding = bills
                    .Where(b => b.ConnectionId == conn.Id)
                    .Sum(b => b.OutstandingBalance),
                TotalConsumption = readings
                    .Where(r => r.ConnectionId == conn.Id)
                    .Sum(r => r.UnitsConsumed),
            })
            .ToList();

        var summary = new ConsumerBillingSummaryDto
        {
            ConsumerId = consumer.Id,
            ConsumerNumber = consumer.ConsumerNumber,
            ConsumerName = $"{consumer.User.FirstName} {consumer.User.LastName}",
            TotalBills = bills.Count,
            TotalBilledAmount = bills.Sum(b => b.TotalAmount),
            TotalPaid = bills.Sum(b => b.AmountPaid),
            OutstandingBalance = bills.Sum(b => b.OutstandingBalance),
            Connections = connectionSummaries,
        };

        return ApiResponse<ConsumerBillingSummaryDto>.SuccessResponse(summary);
    }
}
