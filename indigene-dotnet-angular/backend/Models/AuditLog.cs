namespace IndigeneApi.Models;

public class AuditLog
{
    public int Id { get; set; }
    public int? TenantId { get; set; }
    public string ActorName { get; set; } = null!;
    public string? ActorRole { get; set; }
    public string Action { get; set; } = null!;
    public string? RecordType { get; set; }
    public string? RecordId { get; set; }
    public string? Outcome { get; set; }
    public string? Detail { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
