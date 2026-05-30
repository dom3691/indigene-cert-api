using IndigeneApi.Data;
using IndigeneApi.Models;

namespace IndigeneApi.Services;

public class AuditEntry
{
    public int? TenantId { get; set; }
    public string ActorName { get; set; } = null!;
    public string? ActorRole { get; set; }
    public string Action { get; set; } = null!;
    public string? RecordType { get; set; }
    public string? RecordId { get; set; }
    public string? Outcome { get; set; }
    public string? Detail { get; set; }
}

public class AuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task RecordAsync(AuditEntry entry)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            TenantId = entry.TenantId,
            ActorName = entry.ActorName,
            ActorRole = entry.ActorRole,
            Action = entry.Action,
            RecordType = entry.RecordType,
            RecordId = entry.RecordId,
            Outcome = entry.Outcome,
            Detail = entry.Detail,
        });
        await _db.SaveChangesAsync();
    }
}
