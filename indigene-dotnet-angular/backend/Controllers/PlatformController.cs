using IndigeneApi.Data;
using IndigeneApi.Dtos;
using IndigeneApi.Models;
using IndigeneApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndigeneApi.Controllers;

[ApiController]
[Route("api")]
public class PlatformController : ControllerBase
{
    private readonly AppDbContext _db;

    public PlatformController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("platform/overview")]
    public async Task<ActionResult<PlatformOverviewDto>> Overview()
    {
        var tenants = await _db.Tenants.AsNoTracking().ToListAsync();
        var apps = await _db.Applications.AsNoTracking().ToListAsync();
        var certs = await _db.Certificates.AsNoTracking().ToListAsync();
        var payments = await _db.Payments.AsNoTracking().ToListAsync();

        var successful = payments.Where(p => p.Status == "success").ToList();
        var totalRevenue = successful.Sum(p => Mappers.Num(p.Amount));

        var tenantStats = tenants
            .Select(t =>
            {
                var tApps = apps.Where(a => a.TenantId == t.Id).ToList();
                var tCerts = certs.Where(c => c.TenantId == t.Id && c.Status == "valid").ToList();
                var tRevenue = successful.Where(p => p.TenantId == t.Id).Sum(p => Mappers.Num(p.Amount));
                return new TenantStatDto
                {
                    TenantId = t.Id,
                    TenantName = t.Name,
                    Status = t.Status,
                    Applications = tApps.Count,
                    Certificates = tCerts.Count,
                    Revenue = tRevenue,
                };
            })
            .OrderByDescending(t => t.Applications)
            .ToList();

        var tenantNames = tenants.ToDictionary(t => t.Id, t => t.Name);
        var auditRows = await _db.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .ToListAsync();
        var recentActivity = auditRows
            .Select(r => Mappers.MapAuditLog(r, r.TenantId != null && tenantNames.TryGetValue(r.TenantId.Value, out var n) ? n : null))
            .ToList();

        var data = new PlatformOverviewDto
        {
            TotalTenants = tenants.Count,
            ActiveTenants = tenants.Count(t => t.Status == "active"),
            SuspendedTenants = tenants.Count(t => t.Status == "suspended"),
            TotalApplications = apps.Count,
            TotalCertificates = certs.Count(c => c.Status == "valid"),
            TotalRevenue = totalRevenue,
            Tenants = tenantStats,
            RecentActivity = recentActivity,
        };
        return Ok(data);
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<List<AuditLogDto>>> AuditLogs([FromQuery] int? tenantId, [FromQuery] int? limit)
    {
        var take = limit ?? 50;
        var tenants = await _db.Tenants.AsNoTracking().ToListAsync();
        var tenantNames = tenants.ToDictionary(t => t.Id, t => t.Name);

        IQueryable<AuditLog> query = _db.AuditLogs.AsNoTracking();
        if (tenantId != null)
            query = query.Where(a => a.TenantId == tenantId);
        var rows = await query
            .OrderByDescending(a => a.CreatedAt)
            .Take(take)
            .ToListAsync();

        var data = rows
            .Select(r => Mappers.MapAuditLog(r, r.TenantId != null && tenantNames.TryGetValue(r.TenantId.Value, out var n) ? n : null))
            .ToList();
        return Ok(data);
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<List<NotificationDto>>> Notifications([FromQuery] int? userId)
    {
        if (userId == null)
            return BadRequest(new ErrorResponse { Error = "userId is required" });
        var rows = await _db.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
        return Ok(rows.Select(Mappers.MapNotification).ToList());
    }

    [HttpPost("notifications/{id}/read")]
    public async Task<ActionResult<NotificationDto>> MarkRead(int id)
    {
        var row = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (row == null)
            return NotFound(new ErrorResponse { Error = "Notification not found" });
        row.Read = true;
        await _db.SaveChangesAsync();
        return Ok(Mappers.MapNotification(row));
    }
}
