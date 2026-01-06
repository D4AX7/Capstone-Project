using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.Connection;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConnectionsController : ControllerBase
{
    private readonly IConnectionService _connectionService;
    private readonly IConsumerService _consumerService;

    public ConnectionsController(
        IConnectionService connectionService,
        IConsumerService consumerService
    )
    {
        _connectionService = connectionService;
        _consumerService = consumerService;
    }

    /// <summary>
    /// Get All Connections - Admin (manage), BillingOfficer (for readings)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,BillingOfficer")]
    public async Task<IActionResult> GetAll(
        [FromQuery] PaginationParams paginationParams,
        [FromQuery] int? utilityTypeId = null,
        [FromQuery] string? status = null
    )
    {
        var result = await _connectionService.GetAllAsync(paginationParams, utilityTypeId, status);
        return Ok(result);
    }

    /// <summary>
    /// Get Connection by ID - Admin, BillingOfficer
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,BillingOfficer")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _connectionService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Get My Connections - Consumer only (view their own connections)
    /// </summary>
    [HttpGet("my-connections")]
    [Authorize(Roles = "Consumer")]
    public async Task<IActionResult> GetMyConnections()
    {
        var userId = GetCurrentUserId();
        var consumer = await _consumerService.GetByUserIdAsync(userId);
        if (!consumer.Success)
        {
            return NotFound(consumer);
        }

        var result = await _connectionService.GetByConsumerIdAsync(consumer.Data!.Id);
        return Ok(result);
    }

    /// <summary>
    /// Create Connection - Admin only (manages utility connections)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateConnectionDto dto)
    {
        var result = await _connectionService.CreateAsync(dto);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update Connection - Admin only
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateConnectionDto dto)
    {
        var result = await _connectionService.UpdateAsync(id, dto);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Delete Connection - Admin only
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _connectionService.DeleteAsync(id);
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
