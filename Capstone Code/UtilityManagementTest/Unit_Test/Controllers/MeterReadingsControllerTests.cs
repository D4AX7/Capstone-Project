using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using UtilityManagmentApi.Controllers;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.MeterReading;
using UtilityManagmentApi.Services.Interfaces;
using Xunit;

namespace UtilityManagementTest.Unit_Test.Controllers;

/// <summary>
/// Unit tests for MeterReadingsController
/// </summary>
public class MeterReadingsControllerTests
{
    private readonly Mock<IMeterReadingService> _mockMeterReadingService;
    private readonly MeterReadingsController _controller;

    public MeterReadingsControllerTests()
    {
        _mockMeterReadingService = new Mock<IMeterReadingService>();
        _controller = new MeterReadingsController(_mockMeterReadingService.Object);
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
        var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };
        var pagedResponse = new PagedResponse<MeterReadingListDto> { Data = new List<MeterReadingListDto>() };
        _mockMeterReadingService.Setup(s => s.GetAllAsync(paginationParams, null, null)).ReturnsAsync(pagedResponse);

        // Act
        var result = await _controller.GetAll(paginationParams, null, null);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_WithFilters_ReturnsOkResult()
    {
        // Arrange
        var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };
        var pagedResponse = new PagedResponse<MeterReadingListDto> { Data = new List<MeterReadingListDto>() };
        _mockMeterReadingService.Setup(s => s.GetAllAsync(paginationParams, 1, 2025)).ReturnsAsync(pagedResponse);

        // Act
        var result = await _controller.GetAll(paginationParams, 1, 2025);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOkResult()
    {
        // Arrange
        var readingDto = new MeterReadingDto { Id = 1, UnitsConsumed = 500 };
        _mockMeterReadingService.Setup(s => s.GetByIdAsync(1))
               .ReturnsAsync(ApiResponse<MeterReadingDto>.SuccessResponse(readingDto));

        // Act
        var result = await _controller.GetById(1);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_NotFound_ReturnsNotFound()
    {
        // Arrange
        _mockMeterReadingService.Setup(s => s.GetByIdAsync(999))
   .ReturnsAsync(ApiResponse<MeterReadingDto>.ErrorResponse("Not found"));

        // Act
        var result = await _controller.GetById(999);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetByConnectionId_ReturnsOkResult()
    {
        // Arrange
        var readings = new List<MeterReadingDto> { new MeterReadingDto { Id = 1, UnitsConsumed = 500 } };
        _mockMeterReadingService.Setup(s => s.GetByConnectionIdAsync(1))
             .ReturnsAsync(ApiResponse<List<MeterReadingDto>>.SuccessResponse(readings));

        // Act
        var result = await _controller.GetByConnectionId(1);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByConnectionId_EmptyList_ReturnsOkResult()
    {
        // Arrange
        var readings = new List<MeterReadingDto>();
        _mockMeterReadingService.Setup(s => s.GetByConnectionIdAsync(1))
   .ReturnsAsync(ApiResponse<List<MeterReadingDto>>.SuccessResponse(readings));

        // Act
        var result = await _controller.GetByConnectionId(1);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetLastReading_ReturnsOkResult()
    {
        // Arrange
        _mockMeterReadingService.Setup(s => s.GetLastReadingAsync(1))
            .ReturnsAsync(ApiResponse<decimal>.SuccessResponse(5000m));

        // Act
        var result = await _controller.GetLastReading(1);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_WithValidData_ReturnsCreatedResult()
    {
        // Arrange
        SetupUserClaims(2, "BillingOfficer");
        var createDto = new CreateMeterReadingDto { ConnectionId = 1, CurrentReading = 2000, BillingMonth = 1, BillingYear = 2025 };
        var readingDto = new MeterReadingDto { Id = 1, UnitsConsumed = 500 };
        _mockMeterReadingService.Setup(s => s.CreateAsync(createDto, 2))
    .ReturnsAsync(ApiResponse<MeterReadingDto>.SuccessResponse(readingDto));

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task Create_InvalidReading_ReturnsBadRequest()
    {
        // Arrange
        SetupUserClaims(2, "BillingOfficer");
        var createDto = new CreateMeterReadingDto { ConnectionId = 1, CurrentReading = 100, BillingMonth = 1, BillingYear = 2025 };
        _mockMeterReadingService.Setup(s => s.CreateAsync(createDto, 2))
   .ReturnsAsync(ApiResponse<MeterReadingDto>.ErrorResponse("Current reading must be greater than previous"));

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_ConnectionNotFound_ReturnsBadRequest()
    {
        // Arrange
        SetupUserClaims(2, "BillingOfficer");
        var createDto = new CreateMeterReadingDto { ConnectionId = 999, CurrentReading = 2000, BillingMonth = 1, BillingYear = 2025 };
        _mockMeterReadingService.Setup(s => s.CreateAsync(createDto, 2))
      .ReturnsAsync(ApiResponse<MeterReadingDto>.ErrorResponse("Connection not found"));

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Update_WithValidData_ReturnsOkResult()
    {
        // Arrange
        var updateDto = new UpdateMeterReadingDto { CurrentReading = 2500 };
        var readingDto = new MeterReadingDto { Id = 1, CurrentReading = 2500, UnitsConsumed = 1000 };
        _mockMeterReadingService.Setup(s => s.UpdateAsync(1, updateDto))
         .ReturnsAsync(ApiResponse<MeterReadingDto>.SuccessResponse(readingDto));

        // Act
        var result = await _controller.Update(1, updateDto);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_NotFound_ReturnsBadRequest()
    {
        // Arrange
        var updateDto = new UpdateMeterReadingDto { CurrentReading = 2500 };
        _mockMeterReadingService.Setup(s => s.UpdateAsync(999, updateDto))
 .ReturnsAsync(ApiResponse<MeterReadingDto>.ErrorResponse("Meter reading not found"));

        // Act
        var result = await _controller.Update(999, updateDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetUnbilledReadings_ReturnsOkResult()
    {
        // Arrange
        var readings = new List<MeterReadingListDto> { new MeterReadingListDto { Id = 1 } };
        _mockMeterReadingService.Setup(s => s.GetUnbilledReadingsAsync(null, null))
   .ReturnsAsync(ApiResponse<List<MeterReadingListDto>>.SuccessResponse(readings));

        // Act
        var result = await _controller.GetUnbilledReadings(null, null);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetUnbilledReadings_WithFilters_ReturnsOkResult()
    {
        // Arrange
        var readings = new List<MeterReadingListDto> { new MeterReadingListDto { Id = 1 } };
        _mockMeterReadingService.Setup(s => s.GetUnbilledReadingsAsync(1, 2025))
            .ReturnsAsync(ApiResponse<List<MeterReadingListDto>>.SuccessResponse(readings));

        // Act
        var result = await _controller.GetUnbilledReadings(1, 2025);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetUnbilledReadings_EmptyList_ReturnsOkResult()
    {
        // Arrange
        var readings = new List<MeterReadingListDto>();
        _mockMeterReadingService.Setup(s => s.GetUnbilledReadingsAsync(null, null))
         .ReturnsAsync(ApiResponse<List<MeterReadingListDto>>.SuccessResponse(readings));

        // Act
        var result = await _controller.GetUnbilledReadings(null, null);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }
}
