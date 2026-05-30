using IndigeneApi.Models;
using Microsoft.EntityFrameworkCore;

namespace IndigeneApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Lga> Lgas => Set<Lga>();
    public DbSet<Ward> Wards => Set<Ward>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();

    private const string NowSql = "SYSDATETIMEOFFSET()";

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Tenant>(e =>
        {
            e.ToTable("tenants");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            e.Property(x => x.Code).HasColumnName("code").IsRequired();
            e.Property(x => x.Slug).HasColumnName("slug").IsRequired();
            e.Property(x => x.CertificatePrefix).HasColumnName("certificate_prefix").IsRequired();
            e.Property(x => x.Fee).HasColumnName("fee").HasColumnType("decimal(12,2)").HasDefaultValue(0m);
            e.Property(x => x.Currency).HasColumnName("currency").IsRequired().HasDefaultValue("NGN");
            e.Property(x => x.Status).HasColumnName("status").IsRequired().HasDefaultValue("active");
            e.Property(x => x.ContactEmail).HasColumnName("contact_email");
            e.Property(x => x.ContactPhone).HasColumnName("contact_phone");
            e.Property(x => x.Address).HasColumnName("address");
            e.Property(x => x.Capital).HasColumnName("capital");
            e.Property(x => x.LogoUrl).HasColumnName("logo_url");
            e.Property(x => x.PrimaryColor).HasColumnName("primary_color");
            e.Property(x => x.Tagline).HasColumnName("tagline");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql(NowSql);
        });

        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            e.Property(x => x.Email).HasColumnName("email").IsRequired();
            e.Property(x => x.Role).HasColumnName("role").IsRequired();
            e.Property(x => x.TenantId).HasColumnName("tenant_id");
            e.Property(x => x.Status).HasColumnName("status").IsRequired().HasDefaultValue("active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql(NowSql);
        });

        b.Entity<Lga>(e =>
        {
            e.ToTable("lgas");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            e.Property(x => x.Code).HasColumnName("code");
        });

        b.Entity<Ward>(e =>
        {
            e.ToTable("wards");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.LgaId).HasColumnName("lga_id").IsRequired();
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
        });

        b.Entity<Application>(e =>
        {
            e.ToTable("applications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
            e.Property(x => x.ApplicantId).HasColumnName("applicant_id").IsRequired();
            e.Property(x => x.FirstName).HasColumnName("first_name");
            e.Property(x => x.MiddleName).HasColumnName("middle_name");
            e.Property(x => x.LastName).HasColumnName("last_name");
            e.Property(x => x.Gender).HasColumnName("gender");
            e.Property(x => x.DateOfBirth).HasColumnName("date_of_birth");
            e.Property(x => x.Nin).HasColumnName("nin");
            e.Property(x => x.Email).HasColumnName("email");
            e.Property(x => x.Phone).HasColumnName("phone");
            e.Property(x => x.ResidentialAddress).HasColumnName("residential_address");
            e.Property(x => x.StateOfOrigin).HasColumnName("state_of_origin");
            e.Property(x => x.LgaId).HasColumnName("lga_id");
            e.Property(x => x.WardId).HasColumnName("ward_id");
            e.Property(x => x.FatherName).HasColumnName("father_name");
            e.Property(x => x.MotherName).HasColumnName("mother_name");
            e.Property(x => x.Community).HasColumnName("community");
            e.Property(x => x.Status).HasColumnName("status").IsRequired().HasDefaultValue("draft");
            e.Property(x => x.RejectionReason).HasColumnName("rejection_reason");
            e.Property(x => x.SubmittedAt).HasColumnName("submitted_at");
            e.Property(x => x.ReviewedAt).HasColumnName("reviewed_at");
            e.Property(x => x.ReviewedById).HasColumnName("reviewed_by_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql(NowSql);
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql(NowSql);
        });

        b.Entity<Document>(e =>
        {
            e.ToTable("documents");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            e.Property(x => x.Type).HasColumnName("type").IsRequired();
            e.Property(x => x.FileName).HasColumnName("file_name").IsRequired();
            e.Property(x => x.SizeKb).HasColumnName("size_kb");
            e.Property(x => x.UploadedAt).HasColumnName("uploaded_at").HasDefaultValueSql(NowSql);
        });

        b.Entity<Payment>(e =>
        {
            e.ToTable("payments");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            e.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
            e.Property(x => x.Amount).HasColumnName("amount").HasColumnType("decimal(12,2)").HasDefaultValue(0m);
            e.Property(x => x.Currency).HasColumnName("currency").IsRequired().HasDefaultValue("NGN");
            e.Property(x => x.Reference).HasColumnName("reference").IsRequired();
            e.Property(x => x.Gateway).HasColumnName("gateway");
            e.Property(x => x.Status).HasColumnName("status").IsRequired().HasDefaultValue("success");
            e.Property(x => x.PayerName).HasColumnName("payer_name");
            e.Property(x => x.ReceiptNumber).HasColumnName("receipt_number");
            e.Property(x => x.PaidAt).HasColumnName("paid_at").HasDefaultValueSql(NowSql);
        });

        b.Entity<Certificate>(e =>
        {
            e.ToTable("certificates");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            e.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
            e.Property(x => x.CertificateNumber).HasColumnName("certificate_number").IsRequired();
            e.Property(x => x.ApplicantDisplayName).HasColumnName("applicant_display_name").IsRequired();
            e.Property(x => x.LgaName).HasColumnName("lga_name");
            e.Property(x => x.WardName).HasColumnName("ward_name");
            e.Property(x => x.StateOfOrigin).HasColumnName("state_of_origin");
            e.Property(x => x.IssueDate).HasColumnName("issue_date").HasDefaultValueSql(NowSql);
            e.Property(x => x.Status).HasColumnName("status").IsRequired().HasDefaultValue("valid");
            e.Property(x => x.IssuedById).HasColumnName("issued_by_id");
            e.Property(x => x.IssuedByName).HasColumnName("issued_by_name");
            e.Property(x => x.RevokedReason).HasColumnName("revoked_reason");
        });

        b.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_logs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.TenantId).HasColumnName("tenant_id");
            e.Property(x => x.ActorName).HasColumnName("actor_name").IsRequired();
            e.Property(x => x.ActorRole).HasColumnName("actor_role");
            e.Property(x => x.Action).HasColumnName("action").IsRequired();
            e.Property(x => x.RecordType).HasColumnName("record_type");
            e.Property(x => x.RecordId).HasColumnName("record_id");
            e.Property(x => x.Outcome).HasColumnName("outcome");
            e.Property(x => x.Detail).HasColumnName("detail");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql(NowSql);
        });

        b.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").ValueGeneratedOnAdd();
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.ApplicationId).HasColumnName("application_id");
            e.Property(x => x.Type).HasColumnName("type").IsRequired();
            e.Property(x => x.Title).HasColumnName("title").IsRequired();
            e.Property(x => x.Message).HasColumnName("message").IsRequired();
            e.Property(x => x.Read).HasColumnName("read").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql(NowSql);
        });
    }
}
