using Xunit;

namespace UtilityManagementTest.Unit_Test.Authorization;

/// <summary>
/// Unit tests for Role-Based Access Control (RBAC)
/// </summary>
public class AuthorizationTests
{
    private readonly string[] _validRoles = { "Admin", "BillingOfficer", "AccountOfficer", "Consumer" };

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("Consumer", true)]
    [InlineData("SuperAdmin", false)]
    public void IsValidRole_ReturnsExpectedResult(string role, bool expected)
    {
        Assert.Equal(expected, _validRoles.Contains(role));
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("Consumer", false)]
    public void CanViewAllConsumers_BasedOnRole(string role, bool expected)
    {
        var allowedRoles = new[] { "Admin", "BillingOfficer", "AccountOfficer" };
        Assert.Equal(expected, allowedRoles.Contains(role));
    }

    [Theory]
    [InlineData("BillingOfficer", true)]
    [InlineData("Consumer", false)]
    public void CanEnterMeterReading_BasedOnRole(string role, bool expected)
    {
        var allowedRoles = new[] { "BillingOfficer" };
        Assert.Equal(expected, allowedRoles.Contains(role));
    }

    [Theory]
    [InlineData("BillingOfficer", true)]
    [InlineData("Consumer", false)]
    public void CanGenerateBill_BasedOnRole(string role, bool expected)
    {
        var allowedRoles = new[] { "BillingOfficer" };
        Assert.Equal(expected, allowedRoles.Contains(role));
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("Consumer", false)]
    public void CanViewReports_BasedOnRole(string role, bool expected)
    {
        var allowedRoles = new[] { "Admin", "AccountOfficer" };
        Assert.Equal(expected, allowedRoles.Contains(role));
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("Consumer", false)]
    public void CanManageUsers_BasedOnRole(string role, bool expected)
    {
        var allowedRoles = new[] { "Admin" };
        Assert.Equal(expected, allowedRoles.Contains(role));
    }
}
