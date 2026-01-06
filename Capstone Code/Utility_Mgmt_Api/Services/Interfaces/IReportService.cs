using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Reports;

namespace UtilityManagmentApi.Services.Interfaces;

public interface IReportService
{
    Task<ApiResponse<DashboardSummaryDto>> GetDashboardSummaryAsync();
    Task<ApiResponse<MonthlyRevenueReportDto>> GetMonthlyRevenueReportAsync(int month, int year);
    Task<ApiResponse<List<MonthlyRevenueReportDto>>> GetYearlyRevenueReportAsync(int year);
    Task<ApiResponse<OutstandingDuesReportDto>> GetOutstandingDuesReportAsync();
    Task<ApiResponse<ConsumptionReportDto>> GetConsumptionReportAsync(int month, int year);
    Task<ApiResponse<ConsumerBillingSummaryDto>> GetConsumerBillingSummaryAsync(int consumerId);
}
