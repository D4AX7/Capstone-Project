using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Payment;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IConsumerService _consumerService;
    private readonly IBillService _billService;

    public PaymentsController(
        IPaymentService paymentService,
        IConsumerService consumerService,
        IBillService billService
    )
    {
        _paymentService = paymentService;
        _consumerService = consumerService;
        _billService = billService;
    }

    /// <summary>
    /// Get All Payments - AccountOfficer
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "AccountOfficer")]
    public async Task<IActionResult> GetAll(
        [FromQuery] PaginationParams paginationParams,
        [FromQuery] string? paymentMethod = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null
    )
    {
        var result = await _paymentService.GetAllAsync(
            paginationParams,
            paymentMethod,
            fromDate,
            toDate
        );
        return Ok(result);
    }

    /// <summary>
    /// Get My Payments - Consumer only (view own payment history)
    /// </summary>
    [HttpGet("my-payments")]
    [Authorize(Roles = "Consumer")]
    public async Task<IActionResult> GetMyPayments()
    {
        var userId = GetCurrentUserId();
        var consumer = await _consumerService.GetByUserIdAsync(userId);
        if (!consumer.Success)
        {
            return NotFound(consumer);
        }

        var result = await _paymentService.GetByConsumerIdAsync(consumer.Data!.Id);
        return Ok(result);
    }

    /// <summary>
    /// Pay My Bill - Consumer only (pay their own bills online)
    /// </summary>
    [HttpPost("pay-my-bill")]
    [Authorize(Roles = "Consumer")]
    public async Task<IActionResult> PayMyBill([FromBody] CreatePaymentDto dto)
    {
        var userId = GetCurrentUserId();
        var consumer = await _consumerService.GetByUserIdAsync(userId);
        if (!consumer.Success)
        {
            return NotFound(new { success = false, message = "Consumer not found" });
        }

        // Verify the bill belongs to this consumer
        var bill = await _billService.GetByIdAsync(dto.BillId);
        if (!bill.Success)
        {
            return NotFound(new { success = false, message = "Bill not found" });
        }

        if (bill.Data!.ConsumerNumber != consumer.Data!.ConsumerNumber)
        {
            return Forbid();
        }

        // Create the payment (userId is null for consumer self-payments, or we can pass the consumer's userId)
        var result = await _paymentService.CreateAsync(dto, userId);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("userId");
        return int.Parse(userIdClaim!.Value);
    }
}
