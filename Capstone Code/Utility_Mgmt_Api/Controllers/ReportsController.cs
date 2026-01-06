using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// The Consumer Dashboard does NOT have a single /api/reports/consumer-dashboard endpoint. Instead, it aggregates data from multiple existing endpoints:
    /// GET /api/bills/my-bills	BillsController, GET /api/connections/my-connections, GET /api/payments/my-payments
    /// </summary>
    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin,BillingOfficer,AccountOfficer")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var result = await _reportService.GetDashboardSummaryAsync();
        return Ok(result);
    }

    /// <summary>
    /// Monthly Revenue Report - AccountOfficer
    /// </summary>
    [HttpGet("revenue/monthly")]
    [Authorize(Roles = "AccountOfficer")]
    public async Task<IActionResult> GetMonthlyRevenueReport(
        [FromQuery] int month,
        [FromQuery] int year
    )
    {
        var result = await _reportService.GetMonthlyRevenueReportAsync(month, year);
        return Ok(result);
    }

    /// <summary>
    /// Yearly Revenue Report - AccountOfficer
    /// </summary>
    [HttpGet("revenue/yearly")]
    [Authorize(Roles = "AccountOfficer")]
    public async Task<IActionResult> GetYearlyRevenueReport([FromQuery] int year)
    {
        var result = await _reportService.GetYearlyRevenueReportAsync(year);
        return Ok(result);
    }

    /// <summary>
    /// Outstanding Dues Report - AccountOfficer
    /// </summary>
    [HttpGet("outstanding-dues")]
    [Authorize(Roles = "AccountOfficer")]
    public async Task<IActionResult> GetOutstandingDuesReport()
    {
        var result = await _reportService.GetOutstandingDuesReportAsync();
        return Ok(result);
    }
}
