using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UtilityManagmentApi.Migrations
{
    /// <inheritdoc />
    public partial class RelationshipChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_BillId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_ConnectionRequests_CreatedConnectionId",
                table: "ConnectionRequests");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BillId",
                table: "Payments",
                column: "BillId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConnectionRequests_CreatedConnectionId",
                table: "ConnectionRequests",
                column: "CreatedConnectionId",
                unique: true,
                filter: "[CreatedConnectionId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_BillId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_ConnectionRequests_CreatedConnectionId",
                table: "ConnectionRequests");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BillId",
                table: "Payments",
                column: "BillId");

            migrationBuilder.CreateIndex(
                name: "IX_ConnectionRequests_CreatedConnectionId",
                table: "ConnectionRequests",
                column: "CreatedConnectionId");
        }
    }
}
