namespace IndigeneApi.Models;

public class Certificate
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int TenantId { get; set; }
    public string CertificateNumber { get; set; } = null!;
    public string ApplicantDisplayName { get; set; } = null!;
    public string? LgaName { get; set; }
    public string? WardName { get; set; }
    public string? StateOfOrigin { get; set; }
    public DateTimeOffset IssueDate { get; set; }
    public string Status { get; set; } = "valid";
    public int? IssuedById { get; set; }
    public string? IssuedByName { get; set; }
    public string? RevokedReason { get; set; }
}
