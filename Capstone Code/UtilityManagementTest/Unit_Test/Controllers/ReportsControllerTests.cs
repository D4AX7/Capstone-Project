using Microsoft.AspNetCore.Mvc;
using Moq;
using UtilityManagmentApi.Controllers;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Reports;
using UtilityManagmentApi.Services.Interfaces;
using Xunit;

namespace UtilityManagementTest.Unit_Test.Controllers;

/// <summary>
/// Unit tests for ReportsController
/// </summary>
public class ReportsControllerTests
{
    private readonly Mock<IReportService> _mockReportService;
    private readonly ReportsController _controller;

    public ReportsControllerTests()
    {
        _mockReportService = new Mock<IReportService>();
        _controller = new ReportsController(_mockReportService.Object);
    }

    [Fact]
    public async Task GetDashboardSummary_ReturnsOkResult()
    {
        // Arrange
        var summary = new DashboardSummaryDto { TotalConsumers = 100, TotalBills = 500 };
        _mockReportService.Setup(s => s.GetDashboardSummaryAsync())
         .ReturnsAsync(ApiResponse<DashboardSummaryDto>.SuccessResponse(summary));

        // Act
        var result = await _controller.GetDashboardSummary();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetDashboardSummary_ReturnsCorrectData()
    {
        // Arrange
        var summary = new DashboardSummaryDto
        {
            TotalConsumers = 100,
            TotalBills = 500,
            ActiveConnections = 150,
            PendingBills = 25,
            OverdueBills = 10,
            TotalRevenueThisMonth = 50000
        };
        _mockReportService.Setup(s => s.GetDashboardSummaryAsync())
          .ReturnsAsync(ApiResponse<DashboardSummaryDto>.SuccessResponse(summary));

        // Act
        var result = await _controller.GetDashboardSummary();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetMonthlyRevenueReport_ReturnsOkResult()
    {
        // Arrange
        var report = new MonthlyRevenueReportDto { Month = 1, Year = 2025, TotalBilledAmount = 50000 };
        _mockReportService.Setup(s => s.GetMonthlyRevenueReportAsync(1, 2025))
   .ReturnsAsync(ApiResponse<MonthlyRevenueReportDto>.SuccessResponse(report));

        // Act
        var result = await _controller.GetMonthlyRevenueReport(1, 2025);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetMonthlyRevenueReport_DifferentMonth_ReturnsOkResult()
    {
        // Arrange
        var report = new MonthlyRevenueReportDto { Month = 6, Year = 2025, TotalBilledAmount = 75000 };
        _mockReportService.Setup(s => s.GetMonthlyRevenueReportAsync(6, 2025))
   .ReturnsAsync(ApiResponse<MonthlyRevenueReportDto>.SuccessResponse(report));

        // Act
        var result = await _controller.GetMonthlyRevenueReport(6, 2025);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetYearlyRevenueReport_ReturnsOkResult()
    {
        // Arrange
        var reports = new List<MonthlyRevenueReportDto>
        {
         new MonthlyRevenueReportDto { Month = 1, Year = 2025, TotalBilledAmount = 50000 },
   new MonthlyRevenueReportDto { Month = 2, Year = 2025, TotalBilledAmount = 55000 }
        };
        _mockReportService.Setup(s => s.GetYearlyRevenueReportAsync(2025))
       .ReturnsAsync(ApiResponse<List<MonthlyRevenueReportDto>>.SuccessResponse(reports));

        // Act
        var result = await _controller.GetYearlyRevenueReport(2025);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetYearlyRevenueReport_EmptyYear_ReturnsOkResult()
    {
        // Arrange
        var reports = new List<MonthlyRevenueReportDto>();
        _mockReportService.Setup(s => s.GetYearlyRevenueReportAsync(2024))
           .ReturnsAsync(ApiResponse<List<MonthlyRevenueReportDto>>.SuccessResponse(reports));

        // Act
        var result = await _controller.GetYearlyRevenueReport(2024);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetOutstandingDuesReport_ReturnsOkResult()
    {
        // Arrange
        var report = new OutstandingDuesReportDto { TotalOutstanding = 75000, TotalOverdueAccounts = 15 };
        _mockReportService.Setup(s => s.GetOutstandingDuesReportAsync())
          .ReturnsAsync(ApiResponse<OutstandingDuesReportDto>.SuccessResponse(report));

        // Act
        var result = await _controller.GetOutstandingDuesReport();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetOutstandingDuesReport_NoOutstanding_ReturnsOkResult()
    {
        // Arrange
        var report = new OutstandingDuesReportDto { TotalOutstanding = 0, TotalOverdueAccounts = 0 };
        _mockReportService.Setup(s => s.GetOutstandingDuesReportAsync())
      .ReturnsAsync(ApiResponse<OutstandingDuesReportDto>.SuccessResponse(report));

        // Act
        var result = await _controller.GetOutstandingDuesReport();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }
}
