using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using UtilityManagmentApi.Controllers;
using UtilityManagmentApi.DTOs.BillingCycle;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.Services.Interfaces;
using Xunit;

namespace UtilityManagementTest.Unit_Test.Controllers;

/// <summary>
/// Unit tests for BillingCyclesController
/// </summary>
public class BillingCyclesControllerTests
{
    private readonly Mock<IBillingCycleService> _mockBillingCycleService;
    private readonly BillingCyclesController _controller;

    public BillingCyclesControllerTests()
    {
        _mockBillingCycleService = new Mock<IBillingCycleService>();
        _controller = new BillingCyclesController(_mockBillingCycleService.Object);
    }

    private void SetupUserClaims(int userId, string role)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
          new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    [Fact]
    public async Task GetAll_ReturnsOkResult()
    {
        // Arrange
        var cycles = new List<BillingCycleDto> { new BillingCycleDto { Id = 1, Name = "Jan 2025" } };
        _mockBillingCycleService.Setup(s => s.GetAllAsync(null))
        .ReturnsAsync(ApiResponse<List<BillingCycleDto>>.SuccessResponse(cycles));

        // Act
        var result = await _controller.GetAll(null);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_WithYearFilter_ReturnsOkResult()
    {
        // Arrange
        var cycles = new List<BillingCycleDto> { new BillingCycleDto { Id = 1, Name = "Jan 2025", Year = 2025 } };
        _mockBillingCycleService.Setup(s => s.GetAllAsync(2025))
.ReturnsAsync(ApiResponse<List<BillingCycleDto>>.SuccessResponse(cycles));

        // Act
        var result = await _controller.GetAll(2025);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_EmptyList_ReturnsOkResult()
    {
        // Arrange
        var cycles = new List<BillingCycleDto>();
        _mockBillingCycleService.Setup(s => s.GetAllAsync(null))
    .ReturnsAsync(ApiResponse<List<BillingCycleDto>>.SuccessResponse(cycles));

        // Act
        var result = await _controller.GetAll(null);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetCurrentCycle_ReturnsOkResult()
    {
        // Arrange
        var cycle = new BillingCycleDto { Id = 1, Name = "Jan 2025", Status = "Open" };
        _mockBillingCycleService.Setup(s => s.GetCurrentCycleAsync())
               .ReturnsAsync(ApiResponse<BillingCycleDto>.SuccessResponse(cycle));

        // Act
        var result = await _controller.GetCurrentCycle();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetCurrentCycle_NotFound_ReturnsNotFound()
    {
        // Arrange
        _mockBillingCycleService.Setup(s => s.GetCurrentCycleAsync())
            .ReturnsAsync(ApiResponse<BillingCycleDto>.ErrorResponse("No current cycle"));

        // Act
        var result = await _controller.GetCurrentCycle();

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetCurrentCycle_ReturnsCorrectData()
    {
        // Arrange
        var cycle = new BillingCycleDto
        {
            Id = 1,
            Name = "January 2025",
            Month = 1,
            Year = 2025,
            Status = "Open"
        };
        _mockBillingCycleService.Setup(s => s.GetCurrentCycleAsync())
    .ReturnsAsync(ApiResponse<BillingCycleDto>.SuccessResponse(cycle));

        // Act
        var result = await _controller.GetCurrentCycle();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }
}
