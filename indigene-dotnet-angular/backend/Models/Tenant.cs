namespace IndigeneApi.Models;

public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string CertificatePrefix { get; set; } = null!;
    public decimal Fee { get; set; }
    public string Currency { get; set; } = "NGN";
    public string Status { get; set; } = "active";
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? Capital { get; set; }
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? Tagline { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
