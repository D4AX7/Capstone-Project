using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.MeterReading;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeterReadingsController : ControllerBase
{
    private readonly IMeterReadingService _meterReadingService;

    public MeterReadingsController(IMeterReadingService meterReadingService)
    {
        _meterReadingService = meterReadingService;
    }

    /// <summary>
    /// Get All Meter Readings - BillingOfficer only (enters meter readings)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GetAll(
        [FromQuery] PaginationParams paginationParams,
        [FromQuery] int? billingMonth = null,
        [FromQuery] int? billingYear = null
    )
    {
        var result = await _meterReadingService.GetAllAsync(
            paginationParams,
            billingMonth,
            billingYear
        );
        return Ok(result);
    }

    /// <summary>
    /// Get Meter Reading by ID - BillingOfficer only
    /// Get called by 2 places - #1 while editing meter reading in pending status #2 while generating bills
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _meterReadingService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Get Readings by Connection - BillingOfficer, Consumer (view own consumption)
    /// Get ALL readings (billed + unbilled) for a SPECIFIC connection (When Id is searched for a connection in the search bar).
    /// </summary>
    [HttpGet("connection/{connectionId}")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GetByConnectionId(int connectionId)
    {
        var result = await _meterReadingService.GetByConnectionIdAsync(connectionId);
        return Ok(result);
    }

    /// <summary>
    /// If not provided, returns all unbilled readings.
    /// When Billing Officer clicks on  Generate Bill, the goes to single/bulk generate bill form, he can see all ublilled connections with readings.
    /// </summary>
    [HttpGet("unbilled")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GetUnbilledReadings(
        [FromQuery] int? billingMonth = null,
        [FromQuery] int? billingYear = null
    )
    {
        var result = await _meterReadingService.GetUnbilledReadingsAsync(billingMonth, billingYear);
        return Ok(result);
    }

    /// <summary>
    /// Get Last Reading for Connection - BillingOfficer only
    /// </summary>
    [HttpGet("last-reading/{connectionId}")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> GetLastReading(int connectionId)
    {
        var result = await _meterReadingService.GetLastReadingAsync(connectionId);
        return Ok(result);
    }

    /// <summary>
    /// Create Meter Reading - BillingOfficer only (enters meter readings)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> Create([FromBody] CreateMeterReadingDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _meterReadingService.CreateAsync(dto, userId);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update Meter Reading - BillingOfficer only
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "BillingOfficer")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMeterReadingDto dto)
    {
        var result = await _meterReadingService.UpdateAsync(id, dto);
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
