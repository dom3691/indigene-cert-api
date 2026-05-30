using System.Globalization;
using IndigeneApi.Dtos;
using IndigeneApi.Models;

namespace IndigeneApi.Services;

public static class Mappers
{
    public static string? Iso(DateTimeOffset? d)
    {
        if (d == null) return null;
        return d.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture);
    }

    public static decimal Num(decimal? v) => v ?? 0m;

    public static string VerificationUrl(string certificateNumber)
        => $"/verify?cert={Uri.EscapeDataString(certificateNumber)}";

    public static string FullName(string? first, string? middle, string? last)
    {
        var parts = new[] { first, middle, last }
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Select(p => p!.Trim());
        return string.Join(" ", parts).Trim();
    }

    public static TenantDto MapTenant(Tenant row) => new()
    {
        Id = row.Id,
        Name = row.Name,
        Code = row.Code,
        Slug = row.Slug,
        CertificatePrefix = row.CertificatePrefix,
        Fee = Num(row.Fee),
        Currency = row.Currency,
        Status = row.Status,
        ContactEmail = row.ContactEmail,
        ContactPhone = row.ContactPhone,
        Address = row.Address,
        Capital = row.Capital,
        LogoUrl = row.LogoUrl,
        PrimaryColor = row.PrimaryColor,
        Tagline = row.Tagline,
        CreatedAt = Iso(row.CreatedAt),
    };

    public static WardDto MapWard(Ward row) => new()
    {
        Id = row.Id,
        LgaId = row.LgaId,
        Name = row.Name,
    };

    public static LgaDto MapLga(Lga row, IEnumerable<Ward> wards) => new()
    {
        Id = row.Id,
        TenantId = row.TenantId,
        Name = row.Name,
        Code = row.Code,
        Wards = wards.Select(MapWard).ToList(),
    };

    public static AccountDto MapAccount(User row, string? tenantName) => new()
    {
        Id = row.Id,
        Name = row.Name,
        Email = row.Email,
        Role = row.Role,
        TenantId = row.TenantId,
        TenantName = tenantName,
    };

    public static OfficerDto MapOfficer(User row, int reviewedCount) => new()
    {
        Id = row.Id,
        TenantId = row.TenantId ?? 0,
        Name = row.Name,
        Email = row.Email,
        Role = row.Role,
        Status = row.Status,
        ReviewedCount = reviewedCount,
        CreatedAt = Iso(row.CreatedAt),
    };

    public static DocumentDto MapDocument(Document row) => new()
    {
        Id = row.Id,
        ApplicationId = row.ApplicationId,
        Name = row.Name,
        Type = row.Type,
        FileName = row.FileName,
        SizeKb = row.SizeKb,
        UploadedAt = Iso(row.UploadedAt),
    };

    public static PaymentDto MapPayment(Payment row) => new()
    {
        Id = row.Id,
        ApplicationId = row.ApplicationId,
        TenantId = row.TenantId,
        Amount = Num(row.Amount),
        Currency = row.Currency,
        Reference = row.Reference,
        Gateway = row.Gateway,
        Status = row.Status,
        PayerName = row.PayerName,
        ReceiptNumber = row.ReceiptNumber,
        PaidAt = Iso(row.PaidAt),
    };

    public static CertificateDto MapCertificate(Certificate row, string? tenantName) => new()
    {
        Id = row.Id,
        ApplicationId = row.ApplicationId,
        TenantId = row.TenantId,
        TenantName = tenantName,
        CertificateNumber = row.CertificateNumber,
        ApplicantDisplayName = row.ApplicantDisplayName,
        LgaName = row.LgaName,
        WardName = row.WardName,
        StateOfOrigin = row.StateOfOrigin,
        IssueDate = Iso(row.IssueDate) ?? DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture),
        Status = row.Status,
        VerificationUrl = VerificationUrl(row.CertificateNumber),
        IssuedByName = row.IssuedByName,
        RevokedReason = row.RevokedReason,
    };

    public static ApplicationDto MapApplication(Application row, ApplicationRelations rel) => new()
    {
        Id = row.Id,
        TenantId = row.TenantId,
        TenantName = rel.TenantName,
        ApplicantId = row.ApplicantId,
        ApplicantName = rel.ApplicantName,
        FirstName = row.FirstName,
        MiddleName = row.MiddleName,
        LastName = row.LastName,
        Gender = row.Gender,
        DateOfBirth = row.DateOfBirth,
        Nin = row.Nin,
        Email = row.Email,
        Phone = row.Phone,
        ResidentialAddress = row.ResidentialAddress,
        StateOfOrigin = row.StateOfOrigin,
        LgaId = row.LgaId,
        LgaName = rel.LgaName,
        WardId = row.WardId,
        WardName = rel.WardName,
        FatherName = row.FatherName,
        MotherName = row.MotherName,
        Community = row.Community,
        Status = row.Status,
        RejectionReason = row.RejectionReason,
        SubmittedAt = Iso(row.SubmittedAt),
        ReviewedAt = Iso(row.ReviewedAt),
        ReviewedById = row.ReviewedById,
        ReviewedByName = rel.ReviewedByName,
        CreatedAt = Iso(row.CreatedAt),
        UpdatedAt = Iso(row.UpdatedAt),
        Documents = rel.Documents.Select(MapDocument).ToList(),
        Payment = rel.Payment != null ? MapPayment(rel.Payment) : null,
        Certificate = rel.Certificate != null ? MapCertificate(rel.Certificate, rel.TenantName) : null,
    };

    public static AuditLogDto MapAuditLog(AuditLog row, string? tenantName) => new()
    {
        Id = row.Id,
        TenantId = row.TenantId,
        TenantName = tenantName,
        ActorName = row.ActorName,
        ActorRole = row.ActorRole,
        Action = row.Action,
        RecordType = row.RecordType,
        RecordId = row.RecordId,
        Outcome = row.Outcome,
        Detail = row.Detail,
        CreatedAt = Iso(row.CreatedAt) ?? DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture),
    };

    public static NotificationDto MapNotification(Notification row) => new()
    {
        Id = row.Id,
        UserId = row.UserId,
        ApplicationId = row.ApplicationId,
        Type = row.Type,
        Title = row.Title,
        Message = row.Message,
        Read = row.Read,
        CreatedAt = Iso(row.CreatedAt) ?? DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture),
    };
}

public class ApplicationRelations
{
    public string? TenantName { get; set; }
    public string ApplicantName { get; set; } = "Applicant";
    public string? LgaName { get; set; }
    public string? WardName { get; set; }
    public string? ReviewedByName { get; set; }
    public List<Document> Documents { get; set; } = new();
    public Payment? Payment { get; set; }
    public Certificate? Certificate { get; set; }
}
