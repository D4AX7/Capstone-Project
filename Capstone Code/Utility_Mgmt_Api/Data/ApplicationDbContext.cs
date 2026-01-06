using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Data.Converters;
using UtilityManagmentApi.Entities;

namespace UtilityManagmentApi.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // Note: Users is now inherited from IdentityDbContext as ApplicationUser
    public DbSet<Consumer> Consumers { get; set; }
    public DbSet<UtilityType> UtilityTypes { get; set; }
    public DbSet<TariffPlan> TariffPlans { get; set; }
    public DbSet<Connection> Connections { get; set; }
    public DbSet<ConnectionRequest> ConnectionRequests { get; set; }
    public DbSet<MeterReading> MeterReadings { get; set; }
    public DbSet<Bill> Bills { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<BillingCycle> BillingCycles { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Rename Identity tables for clarity (optional but cleaner)
        modelBuilder.Entity<ApplicationUser>().ToTable("Users");
        modelBuilder.Entity<ApplicationRole>().ToTable("Roles");
        modelBuilder.Entity<IdentityUserRole<int>>().ToTable("UserRoles");
        modelBuilder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims");
        modelBuilder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins");
        modelBuilder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims");
        modelBuilder.Entity<IdentityUserToken<int>>().ToTable("UserTokens");

        // ApplicationUser configuration
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
        });

        // Consumer configuration
        modelBuilder.Entity<Consumer>(entity =>
        {
            entity.HasIndex(e => e.ConsumerNumber).IsUnique();
            entity
                .HasOne(c => c.User)
                .WithOne(u => u.Consumer)
                .HasForeignKey<Consumer>(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // UtilityType configuration
        modelBuilder.Entity<UtilityType>(entity =>
        {
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // TariffPlan configuration
        modelBuilder.Entity<TariffPlan>(entity =>
        {
            entity
                .HasOne(t => t.UtilityType)
                .WithMany(u => u.TariffPlans)
                .HasForeignKey(t => t.UtilityTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Connection configuration
        modelBuilder.Entity<Connection>(entity =>
        {
            entity.HasIndex(e => e.MeterNumber).IsUnique();
            entity.HasIndex(e => e.ConnectionNumber).IsUnique();
            entity.Property(e => e.Status).HasConversion<string>();

            entity
                .HasOne(c => c.Consumer)
                .WithMany(co => co.Connections)
                .HasForeignKey(c => c.ConsumerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(c => c.UtilityType)
                .WithMany(u => u.Connections)
                .HasForeignKey(c => c.UtilityTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(c => c.TariffPlan)
                .WithMany(t => t.Connections)
                .HasForeignKey(c => c.TariffPlanId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ConnectionRequest configuration
        modelBuilder.Entity<ConnectionRequest>(entity =>
        {
            entity.HasIndex(e => e.RequestNumber).IsUnique();
            entity.Property(e => e.Status).HasConversion<string>();

            entity
                .HasOne(r => r.Consumer)
                .WithMany()
                .HasForeignKey(r => r.ConsumerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(r => r.UtilityType)
                .WithMany()
                .HasForeignKey(r => r.UtilityTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(r => r.TariffPlan)
                .WithMany()
                .HasForeignKey(r => r.TariffPlanId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(r => r.ProcessedByUser)
                .WithMany()
                .HasForeignKey(r => r.ProcessedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(r => r.CreatedConnection)
                .WithOne()
                .HasForeignKey<ConnectionRequest>(r => r.CreatedConnectionId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // MeterReading configuration
        modelBuilder.Entity<MeterReading>(entity =>
        {
            entity
                .HasIndex(e => new
                {
                    e.ConnectionId,
                    e.BillingMonth,
                    e.BillingYear,
                })
                .IsUnique();

            entity
                .HasOne(m => m.Connection)
                .WithMany(c => c.MeterReadings)
                .HasForeignKey(m => m.ConnectionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(m => m.ReadByUser)
                .WithMany()
                .HasForeignKey(m => m.ReadByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Bill configuration
        modelBuilder.Entity<Bill>(entity =>
        {
            entity.HasIndex(e => e.BillNumber).IsUnique();
            entity
                .HasIndex(e => new
                {
                    e.ConnectionId,
                    e.BillingMonth,
                    e.BillingYear,
                })
                .IsUnique();
            entity.Property(e => e.Status).HasConversion<string>();
            entity
                .Property(e => e.BillDate)
                .HasColumnType("date")
                .HasConversion<DateOnlyConverter>();
            entity
                .Property(e => e.DueDate)
                .HasColumnType("date")
                .HasConversion<DateOnlyConverter>();

            entity
                .HasOne(b => b.Connection)
                .WithMany(c => c.Bills)
                .HasForeignKey(b => b.ConnectionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(b => b.MeterReading)
                .WithOne(m => m.Bill)
                .HasForeignKey<Bill>(b => b.MeterReadingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(b => b.GeneratedByUser)
                .WithMany()
                .HasForeignKey(b => b.GeneratedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Payment configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasIndex(e => e.PaymentNumber).IsUnique();
            entity.Property(e => e.PaymentMethod).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();

            entity
                .HasOne(p => p.Bill)
                .WithOne(b => b.Payment)
                .HasForeignKey<Payment>(p => p.BillId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(p => p.ReceivedByUser)
                .WithMany()
                .HasForeignKey(p => p.ReceivedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // BillingCycle configuration with DateOnly converters
        modelBuilder.Entity<BillingCycle>(entity =>
        {
            entity.HasIndex(e => new { e.Month, e.Year }).IsUnique();
            entity.Property(e => e.Status).HasConversion<string>();
            entity
                .Property(e => e.StartDate)
                .HasColumnType("date")
                .HasConversion<DateOnlyConverter>();
            entity
                .Property(e => e.EndDate)
                .HasColumnType("date")
                .HasConversion<DateOnlyConverter>();
            entity
                .Property(e => e.BillGenerationDate)
                .HasColumnType("date")
                .HasConversion<NullableDateOnlyConverter>();
            entity
                .Property(e => e.DueDate)
                .HasColumnType("date")
                .HasConversion<NullableDateOnlyConverter>();
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(e => e.Type).HasConversion<string>();

            entity
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
