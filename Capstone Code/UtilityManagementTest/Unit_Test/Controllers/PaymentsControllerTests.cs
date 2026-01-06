using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using UtilityManagmentApi.Controllers;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Consumer;
using UtilityManagmentApi.DTOs.Payment;
using UtilityManagmentApi.DTOs.Bill;
using UtilityManagmentApi.Services.Interfaces;
using Xunit;

namespace UtilityManagementTest.Unit_Test.Controllers;

/// <summary>
/// Unit tests for PaymentsController
/// </summary>
public class PaymentsControllerTests
{
    private readonly Mock<IPaymentService> _mockPaymentService;
    private readonly Mock<IConsumerService> _mockConsumerService;
    private readonly Mock<IBillService> _mockBillService;
    private readonly PaymentsController _controller;

    public PaymentsControllerTests()
    {
        _mockPaymentService = new Mock<IPaymentService>();
        _mockConsumerService = new Mock<IConsumerService>();
        _mockBillService = new Mock<IBillService>();
        _controller = new PaymentsController(
            _mockPaymentService.Object,
            _mockConsumerService.Object,
            _mockBillService.Object);
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
        var pagedResponse = new PagedResponse<PaymentListDto> { Data = new List<PaymentListDto>() };
        _mockPaymentService.Setup(s => s.GetAllAsync(paginationParams, null, null, null)).ReturnsAsync(pagedResponse);

        // Act
        var result = await _controller.GetAll(paginationParams, null, null, null);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_WithFilters_ReturnsOkResult()
    {
        // Arrange
        var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };
        var fromDate = DateTime.Now.AddDays(-30);
        var toDate = DateTime.Now;
        var pagedResponse = new PagedResponse<PaymentListDto> { Data = new List<PaymentListDto>() };
        _mockPaymentService.Setup(s => s.GetAllAsync(paginationParams, "Online", fromDate, toDate)).ReturnsAsync(pagedResponse);

        // Act
        var result = await _controller.GetAll(paginationParams, "Online", fromDate, toDate);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetMyPayments_AsConsumer_ReturnsOkResult()
    {
        // Arrange
        SetupUserClaims(5, "Consumer");
        var consumerDto = new ConsumerDto { Id = 1, UserId = 5, ConsumerNumber = "CON001" };
        var payments = new List<PaymentDto> { new PaymentDto { Id = 1, Amount = 500 } };

        _mockConsumerService.Setup(s => s.GetByUserIdAsync(5))
    .ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));
        _mockPaymentService.Setup(s => s.GetByConsumerIdAsync(1))
                .ReturnsAsync(ApiResponse<List<PaymentDto>>.SuccessResponse(payments));

        // Act
        var result = await _controller.GetMyPayments();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetMyPayments_ConsumerNotFound_ReturnsNotFound()
    {
        // Arrange
        SetupUserClaims(999, "Consumer");
        _mockConsumerService.Setup(s => s.GetByUserIdAsync(999))
       .ReturnsAsync(ApiResponse<ConsumerDto>.ErrorResponse("Consumer not found"));

        // Act
        var result = await _controller.GetMyPayments();

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task PayMyBill_WithOwnBill_ReturnsOkResult()
    {
        // Arrange
        SetupUserClaims(5, "Consumer");
        var createDto = new CreatePaymentDto { BillId = 1, Amount = 100, PaymentMethod = "Online" };
        var consumerDto = new ConsumerDto { Id = 1, UserId = 5, ConsumerNumber = "CON001" };
        var billDto = new BillDto { Id = 1, ConsumerNumber = "CON001" };
        var paymentDto = new PaymentDto { Id = 1, Amount = 100 };

        _mockConsumerService.Setup(s => s.GetByUserIdAsync(5)).ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));
        _mockBillService.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(ApiResponse<BillDto>.SuccessResponse(billDto));
        _mockPaymentService.Setup(s => s.CreateAsync(createDto, 5)).ReturnsAsync(ApiResponse<PaymentDto>.SuccessResponse(paymentDto));

        // Act
        var result = await _controller.PayMyBill(createDto);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task PayMyBill_WithOthersBill_ReturnsForbid()
    {
        // Arrange
        SetupUserClaims(5, "Consumer");
        var createDto = new CreatePaymentDto { BillId = 1, Amount = 100, PaymentMethod = "Online" };
        var consumerDto = new ConsumerDto { Id = 1, UserId = 5, ConsumerNumber = "CON001" };
        var billDto = new BillDto { Id = 1, ConsumerNumber = "CON002" };

        _mockConsumerService.Setup(s => s.GetByUserIdAsync(5)).ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));
        _mockBillService.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(ApiResponse<BillDto>.SuccessResponse(billDto));

        // Act
        var result = await _controller.PayMyBill(createDto);

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task PayMyBill_ConsumerNotFound_ReturnsNotFound()
    {
        // Arrange
        SetupUserClaims(999, "Consumer");
        var createDto = new CreatePaymentDto { BillId = 1, Amount = 100, PaymentMethod = "Online" };

        _mockConsumerService.Setup(s => s.GetByUserIdAsync(999))
   .ReturnsAsync(ApiResponse<ConsumerDto>.ErrorResponse("Consumer not found"));

        // Act
        var result = await _controller.PayMyBill(createDto);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task PayMyBill_BillNotFound_ReturnsNotFound()
    {
        // Arrange
        SetupUserClaims(5, "Consumer");
        var createDto = new CreatePaymentDto { BillId = 999, Amount = 100, PaymentMethod = "Online" };
        var consumerDto = new ConsumerDto { Id = 1, UserId = 5, ConsumerNumber = "CON001" };

        _mockConsumerService.Setup(s => s.GetByUserIdAsync(5))
          .ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));
        _mockBillService.Setup(s => s.GetByIdAsync(999))
      .ReturnsAsync(ApiResponse<BillDto>.ErrorResponse("Bill not found"));

        // Act
        var result = await _controller.PayMyBill(createDto);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task PayMyBill_PaymentFails_ReturnsBadRequest()
    {
        // Arrange
        SetupUserClaims(5, "Consumer");
        var createDto = new CreatePaymentDto { BillId = 1, Amount = 100, PaymentMethod = "Online" };
        var consumerDto = new ConsumerDto { Id = 1, UserId = 5, ConsumerNumber = "CON001" };
        var billDto = new BillDto { Id = 1, ConsumerNumber = "CON001" };

        _mockConsumerService.Setup(s => s.GetByUserIdAsync(5)).ReturnsAsync(ApiResponse<ConsumerDto>.SuccessResponse(consumerDto));
        _mockBillService.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(ApiResponse<BillDto>.SuccessResponse(billDto));
        _mockPaymentService.Setup(s => s.CreateAsync(createDto, 5))
        .ReturnsAsync(ApiResponse<PaymentDto>.ErrorResponse("Payment processing failed"));

        // Act
        var result = await _controller.PayMyBill(createDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }
}
