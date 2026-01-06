using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UtilityManagmentApi.DTOs.Bill;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.Services.Interfaces;
using System.Security.Claims;

namespace UtilityManagmentApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly IBillService _billService;
    private readonly IConsumerService _consumerService;

    public BillsController(IBillService billService, IConsumerService consumerService)
    {
        _billService = billService;
        _consumerService = consumerService;
    }

    /// <summary>
    /// Get All Bills - Admin, BillingOfficer, AccountOfficer
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GetAll(
        [FromQuery] PaginationParams paginationParams,
        [FromQuery] string? status = null,
        [FromQuery] int? billingMonth = null,
        [FromQuery] int? billingYear = null)
    {
        var result = await _billService.GetAllAsync(paginationParams, status, billingMonth, billingYear);
        return Ok(result);
    }

    /// <summary>
    /// Get Bill by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _billService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get Bill Summary - BillingOfficer only (used for Bill Status Distribution in dashboard)
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GetSummary([FromQuery] int? billingMonth = null, [FromQuery] int? billingYear = null)
    {
        var result = await _billService.GetSummaryAsync(billingMonth, billingYear);
        return Ok(result);
    }

    /// <summary>
    /// Get My Bills - Consumer only (view their own bills)
    /// </summary>
    [HttpGet("my-bills")]
    [Authorize(Roles = "Consumer")]
    public async Task<IActionResult> GetMyBills()
    {
        var userId = GetCurrentUserId();
        var consumer = await _consumerService.GetByUserIdAsync(userId);
        if (!consumer.Success)
        {
            return NotFound(consumer);
        }

        var result = await _billService.GetByConsumerIdAsync(consumer.Data!.Id);
        return Ok(result);
    }

    /// <summary>
    /// Get My Bill by ID - Consumer only (view their own bill details)
    /// </summary>
    [HttpGet("my-bills/{id}")]
    [Authorize(Roles = "Consumer")]
    public async Task<IActionResult> GetMyBillById(int id)
    {
        var userId = GetCurrentUserId();
        var consumer = await _consumerService.GetByUserIdAsync(userId);
        if (!consumer.Success)
        {
            return NotFound(consumer);
        }

        var result = await _billService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }

        // Verify the bill belongs to this consumer
        var consumerBills = await _billService.GetByConsumerIdAsync(consumer.Data!.Id);
        if (!consumerBills.Success || !consumerBills.Data!.Any(b => b.Id == id))
        {
            return Forbid();
        }

        return Ok(result);
    }

    /// <summary>
    /// Generate Bill -  BillingOfficer
    /// </summary>
    [HttpPost("generate")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GenerateBill([FromBody] GenerateBillDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _billService.GenerateBillAsync(dto, userId);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Generate Bulk Bills -  BillingOfficer
    /// </summary>
    [HttpPost("generate-bulk")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GenerateBulkBills([FromBody] GenerateBulkBillsDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _billService.GenerateBulkBillsAsync(dto, userId);
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
