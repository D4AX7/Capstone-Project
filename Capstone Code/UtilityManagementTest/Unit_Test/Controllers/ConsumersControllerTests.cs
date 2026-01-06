using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using UtilityManagmentApi.Controllers;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Consumer;
using UtilityManagmentApi.Services.Interfaces;
using Xunit;

namespace UtilityManagementTest.Unit_Test.Controllers;

/// <summary>
/// Unit tests for ConsumersController
/// </summary>
public class ConsumersControllerTests
{
    private readonly Mock<IConsumerService> _mockConsumerService;
    private readonly ConsumersController _controller;

    public ConsumersControllerTests()
    {
        _mockConsumerService = new Mock<IConsumerService>();
        _controller = new ConsumersController(_mockConsumerService.Object);
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
        var pagedResponse = new PagedResponse<ConsumerListDto> { Data = new List<ConsumerListDto>(), TotalRecords = 0 };
        _mockConsumerService.Setup(s => s.GetAllAsync(paginationParams, null)).ReturnsAsync(pagedResponse);

        // Act
        var result = await _controller.GetAll(paginationParams, null);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_AsAdmin_ReturnsOkResult()
    {
        // Arrange
        SetupUserClaims(1, "Admin");
        var consumerDto = new ConsumerDto { Id = 1, ConsumerNumber = "CON001" };
        _mockConsumerService.Setup(s => s.GetByIdAsync(1))
    .ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));

        // Act
        var result = await _controller.GetById(1);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_NotFound_ReturnsNotFound()
    {
        // Arrange
        SetupUserClaims(1, "Admin");
        _mockConsumerService.Setup(s => s.GetByIdAsync(999))
  .ReturnsAsync(ApiResponse<ConsumerDto>.ErrorResponse("Not found"));

        // Act
        var result = await _controller.GetById(999);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetMyProfile_ReturnsOkResult()
    {
        // Arrange
        SetupUserClaims(5, "Consumer");
        var consumerDto = new ConsumerDto { Id = 1, UserId = 5 };
        _mockConsumerService.Setup(s => s.GetByUserIdAsync(5))
       .ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));

        // Act
        var result = await _controller.GetMyProfile();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetMyProfile_NotFound_ReturnsNotFound()
    {
        // Arrange
        SetupUserClaims(999, "Consumer");
        _mockConsumerService.Setup(s => s.GetByUserIdAsync(999))
              .ReturnsAsync(ApiResponse<ConsumerDto>.ErrorResponse("Not found"));

        // Act
        var result = await _controller.GetMyProfile();

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Create_WithValidData_ReturnsCreatedResult()
    {
        // Arrange
        SetupUserClaims(1, "Admin");
        var createDto = new CreateConsumerDto
        {
            FirstName = "New",
            LastName = "Consumer",
            Email = "new@test.com",
            Password = "Test@123",
            Address = "123 St",
            City = "City",
            State = "State",
            PostalCode = "12345"
        };
        var consumerDto = new ConsumerDto { Id = 10, ConsumerNumber = "CON010" };
        _mockConsumerService.Setup(s => s.CreateAsync(createDto))
    .ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        Assert.IsType<CreatedAtActionResult>(result);
    }

    [Fact]
    public async Task UpdateMyProfile_ReturnsOkResult()
    {
        // Arrange
        SetupUserClaims(5, "Consumer");
        var consumerDto = new ConsumerDto { Id = 1, UserId = 5 };
        var updateDto = new UpdateConsumerDto { Address = "New Address", City = "New City" };

        _mockConsumerService.Setup(s => s.GetByUserIdAsync(5))
    .ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));
        _mockConsumerService.Setup(s => s.UpdateAsync(1, updateDto))
                 .ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));

        // Act
        var result = await _controller.UpdateMyProfile(updateDto);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_AsAdmin_ReturnsOkResult()
    {
        // Arrange
        SetupUserClaims(1, "Admin");
        var updateDto = new UpdateConsumerDto { Address = "Updated Address" };
        var consumerDto = new ConsumerDto { Id = 1, ConsumerNumber = "CON001" };
        _mockConsumerService.Setup(s => s.UpdateAsync(1, updateDto))
          .ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));

        // Act
        var result = await _controller.Update(1, updateDto);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }
}
