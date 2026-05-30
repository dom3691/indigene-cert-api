namespace IndigeneApi.Dtos;

public class ErrorResponse
{
    public string Error { get; set; } = null!;
}

public class HealthStatusDto
{
    public string Status { get; set; } = "ok";
}

public class TenantDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string CertificatePrefix { get; set; } = null!;
    public decimal Fee { get; set; }
    public string Currency { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? Capital { get; set; }
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? Tagline { get; set; }
    public string? CreatedAt { get; set; }
}

public class AccountDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public int? TenantId { get; set; }
    public string? TenantName { get; set; }
}

public class OfficerDto
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int ReviewedCount { get; set; }
    public string? CreatedAt { get; set; }
}

public class WardDto
{
    public int Id { get; set; }
    public int LgaId { get; set; }
    public string Name { get; set; } = null!;
}

public class LgaDto
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public List<WardDto> Wards { get; set; } = new();
}

public class DocumentDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public int? SizeKb { get; set; }
    public string? UploadedAt { get; set; }
}

public class PaymentDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int TenantId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = null!;
    public string Reference { get; set; } = null!;
    public string? Gateway { get; set; }
    public string Status { get; set; } = null!;
    public string? PayerName { get; set; }
    public string? ReceiptNumber { get; set; }
    public string? PaidAt { get; set; }
}

public class CertificateDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int TenantId { get; set; }
    public string? TenantName { get; set; }
    public string CertificateNumber { get; set; } = null!;
    public string ApplicantDisplayName { get; set; } = null!;
    public string? LgaName { get; set; }
    public string? WardName { get; set; }
    public string? StateOfOrigin { get; set; }
    public string IssueDate { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string VerificationUrl { get; set; } = null!;
    public string? IssuedByName { get; set; }
    public string? RevokedReason { get; set; }
}

public class ApplicationDto
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string? TenantName { get; set; }
    public int ApplicantId { get; set; }
    public string ApplicantName { get; set; } = null!;
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? Gender { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Nin { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? ResidentialAddress { get; set; }
    public string? StateOfOrigin { get; set; }
    public int? LgaId { get; set; }
    public string? LgaName { get; set; }
    public int? WardId { get; set; }
    public string? WardName { get; set; }
    public string? FatherName { get; set; }
    public string? MotherName { get; set; }
    public string? Community { get; set; }
    public string Status { get; set; } = null!;
    public string? RejectionReason { get; set; }
    public string? SubmittedAt { get; set; }
    public string? ReviewedAt { get; set; }
    public int? ReviewedById { get; set; }
    public string? ReviewedByName { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
    public List<DocumentDto> Documents { get; set; } = new();
    public PaymentDto? Payment { get; set; }
    public CertificateDto? Certificate { get; set; }
}

public class AuditLogDto
{
    public int Id { get; set; }
    public int? TenantId { get; set; }
    public string? TenantName { get; set; }
    public string ActorName { get; set; } = null!;
    public string? ActorRole { get; set; }
    public string Action { get; set; } = null!;
    public string? RecordType { get; set; }
    public string? RecordId { get; set; }
    public string? Outcome { get; set; }
    public string? Detail { get; set; }
    public string CreatedAt { get; set; } = null!;
}

public class NotificationDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? ApplicationId { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public bool Read { get; set; }
    public string CreatedAt { get; set; } = null!;
}

public class VerificationResultDto
{
    public bool Found { get; set; }
    public string Status { get; set; } = null!;
    public string Result { get; set; } = null!;
    public string CertificateNumber { get; set; } = null!;
    public string? ApplicantDisplayName { get; set; }
    public string? TenantName { get; set; }
    public string? LgaName { get; set; }
    public string? StateOfOrigin { get; set; }
    public string? IssueDate { get; set; }
}

public class StatusCountDto
{
    public string Status { get; set; } = null!;
    public int Count { get; set; }
}

public class LgaCountDto
{
    public string LgaName { get; set; } = null!;
    public int Count { get; set; }
}

public class TrendPointDto
{
    public string Month { get; set; } = null!;
    public int Applications { get; set; }
    public int Certificates { get; set; }
}

public class TenantDashboardDto
{
    public int TenantId { get; set; }
    public string TenantName { get; set; } = null!;
    public int TotalApplications { get; set; }
    public int PendingReview { get; set; }
    public int IssuedCertificates { get; set; }
    public int RejectedApplications { get; set; }
    public decimal TotalRevenue { get; set; }
    public int SuccessfulPayments { get; set; }
    public List<StatusCountDto> StatusBreakdown { get; set; } = new();
    public List<LgaCountDto> LgaBreakdown { get; set; } = new();
    public List<TrendPointDto> MonthlyTrend { get; set; } = new();
    public List<ApplicationDto> RecentApplications { get; set; } = new();
    public List<AuditLogDto> RecentActivity { get; set; } = new();
}

public class TenantStatDto
{
    public int TenantId { get; set; }
    public string TenantName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int Applications { get; set; }
    public int Certificates { get; set; }
    public decimal Revenue { get; set; }
}

public class PlatformOverviewDto
{
    public int TotalTenants { get; set; }
    public int ActiveTenants { get; set; }
    public int SuspendedTenants { get; set; }
    public int TotalApplications { get; set; }
    public int TotalCertificates { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<TenantStatDto> Tenants { get; set; } = new();
    public List<AuditLogDto> RecentActivity { get; set; } = new();
}
