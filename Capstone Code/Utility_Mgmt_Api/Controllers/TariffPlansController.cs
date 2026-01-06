using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UtilityManagmentApi.DTOs.Common;
using UtilityManagmentApi.DTOs.TariffPlan;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Controllers;

/// <summary>
/// Tariff Plans Controller - Admin only manages (manages tariffs)
/// Other roles can only read tariff plans for their work
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TariffPlansController : ControllerBase
{
    private readonly ITariffPlanService _tariffPlanService;

    public TariffPlansController(ITariffPlanService tariffPlanService)
    {
        _tariffPlanService = tariffPlanService;
    }

    /// <summary>
    /// Get All Tariff Plans - All roles can read (needed for billing calculations)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool? isActive = null,
        [FromQuery] int? utilityTypeId = null
    )
    {
        var result = await _tariffPlanService.GetAllAsync(isActive, utilityTypeId);
        return Ok(result);
    }

    /// <summary>
    /// Create Tariff Plan - Admin only (manages tariffs)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateTariffPlanDto dto)
    {
        var result = await _tariffPlanService.CreateAsync(dto);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Update Tariff Plan - Admin only
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTariffPlanDto dto)
    {
        var result = await _tariffPlanService.UpdateAsync(id, dto);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Delete Tariff Plan - Admin only
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _tariffPlanService.DeleteAsync(id);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
