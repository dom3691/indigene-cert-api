using System.Globalization;
using IndigeneApi.Data;
using IndigeneApi.Dtos;
using IndigeneApi.Models;
using IndigeneApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndigeneApi.Controllers;

[ApiController]
[Route("api")]
public class TenantsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public TenantsController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet("tenants")]
    public async Task<ActionResult<List<TenantDto>>> List([FromQuery] string? status)
    {
        var query = _db.Tenants.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(status))
            query = query.Where(t => t.Status == status);
        var rows = await query.ToListAsync();
        rows = rows.OrderBy(t => t.Name, StringComparer.Ordinal).ToList();
        return Ok(rows.Select(Mappers.MapTenant).ToList());
    }

    [HttpPost("tenants")]
    public async Task<ActionResult<TenantDto>> Create([FromBody] TenantInput body)
    {
        if (body == null || string.IsNullOrEmpty(body.Name) || string.IsNullOrEmpty(body.Code)
            || string.IsNullOrEmpty(body.CertificatePrefix) || body.Fee == null)
            return BadRequest(new ErrorResponse { Error = "Invalid tenant input" });

        var row = new Tenant
        {
            Name = body.Name,
            Code = body.Code,
            Slug = Utils.Slugify(body.Name),
            CertificatePrefix = body.CertificatePrefix,
            Fee = body.Fee.Value,
            Currency = body.Currency ?? "NGN",
            Status = "active",
            ContactEmail = body.ContactEmail,
            ContactPhone = body.ContactPhone,
            Address = body.Address,
            Capital = body.Capital,
            PrimaryColor = body.PrimaryColor,
            Tagline = body.Tagline,
        };
        _db.Tenants.Add(row);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(new AuditEntry
        {
            TenantId = row.Id,
            ActorName = "Platform Super Admin",
            ActorRole = "super_admin",
            Action = "Created tenant",
            RecordType = "tenant",
            RecordId = row.Id.ToString(),
            Outcome = "success",
            Detail = $"Onboarded {row.Name}",
        });

        return StatusCode(201, Mappers.MapTenant(row));
    }

    [HttpGet("tenants/{id}")]
    public async Task<ActionResult<TenantDto>> Get(int id)
    {
        var row = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
        if (row == null)
            return NotFound(new ErrorResponse { Error = "Tenant not found" });
        return Ok(Mappers.MapTenant(row));
    }

    [HttpPatch("tenants/{id}")]
    public async Task<ActionResult<TenantDto>> Update(int id, [FromBody] TenantUpdate body)
    {
        var row = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == id);
        if (row == null)
            return NotFound(new ErrorResponse { Error = "Tenant not found" });

        if (body.Name != null) row.Name = body.Name;
        if (body.CertificatePrefix != null) row.CertificatePrefix = body.CertificatePrefix;
        if (body.Fee != null) row.Fee = body.Fee.Value;
        if (body.Currency != null) row.Currency = body.Currency;
        if (body.Status != null) row.Status = body.Status;
        if (body.ContactEmail != null) row.ContactEmail = body.ContactEmail;
        if (body.ContactPhone != null) row.ContactPhone = body.ContactPhone;
        if (body.Address != null) row.Address = body.Address;
        if (body.Capital != null) row.Capital = body.Capital;
        if (body.PrimaryColor != null) row.PrimaryColor = body.PrimaryColor;
        if (body.Tagline != null) row.Tagline = body.Tagline;

        await _db.SaveChangesAsync();

        await _audit.RecordAsync(new AuditEntry
        {
            TenantId = row.Id,
            ActorName = "Administrator",
            ActorRole = "tenant_admin",
            Action = body.Status != null ? $"Set tenant status to {body.Status}" : "Updated tenant settings",
            RecordType = "tenant",
            RecordId = row.Id.ToString(),
            Outcome = "success",
            Detail = $"Updated {row.Name}",
        });

        return Ok(Mappers.MapTenant(row));
    }

    // Geography
    [HttpGet("tenants/{id}/lgas")]
    public async Task<ActionResult<List<LgaDto>>> ListLgas(int id)
    {
        var lgas = await _db.Lgas.AsNoTracking().Where(l => l.TenantId == id).ToListAsync();
        var lgaIds = lgas.Select(l => l.Id).ToList();
        var wards = lgaIds.Count > 0
            ? await _db.Wards.AsNoTracking().Where(w => lgaIds.Contains(w.LgaId)).ToListAsync()
            : new List<Ward>();
        var ordered = lgas.OrderBy(l => l.Name, StringComparer.Ordinal).ToList();
        var data = ordered.Select(l => Mappers.MapLga(
            l,
            wards.Where(w => w.LgaId == l.Id).OrderBy(w => w.Name, StringComparer.Ordinal)))
            .ToList();
        return Ok(data);
    }

    [HttpPost("tenants/{id}/lgas")]
    public async Task<ActionResult<LgaDto>> CreateLga(int id, [FromBody] LgaInput body)
    {
        if (body == null || string.IsNullOrEmpty(body.Name))
            return BadRequest(new ErrorResponse { Error = "Invalid LGA input" });

        var row = new Lga
        {
            TenantId = id,
            Name = body.Name,
            Code = body.Code,
        };
        _db.Lgas.Add(row);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(new AuditEntry
        {
            TenantId = id,
            ActorName = "Administrator",
            ActorRole = "tenant_admin",
            Action = "Added LGA",
            RecordType = "lga",
            RecordId = row.Id.ToString(),
            Outcome = "success",
            Detail = $"Added {row.Name}",
        });

        return StatusCode(201, Mappers.MapLga(row, new List<Ward>()));
    }

    [HttpPost("lgas/{id}/wards")]
    public async Task<ActionResult<WardDto>> CreateWard(int id, [FromBody] WardInput body)
    {
        if (body == null || string.IsNullOrEmpty(body.Name))
            return BadRequest(new ErrorResponse { Error = "Invalid ward input" });

        var row = new Ward
        {
            LgaId = id,
            Name = body.Name,
        };
        _db.Wards.Add(row);
        await _db.SaveChangesAsync();
        return StatusCode(201, Mappers.MapWard(row));
    }

    // Officers
    [HttpGet("tenants/{id}/officers")]
    public async Task<ActionResult<List<OfficerDto>>> ListOfficers(int id)
    {
        var officers = await _db.Users.AsNoTracking().Where(u => u.TenantId == id).ToListAsync();
        var filtered = officers.Where(o => o.Role == "officer" || o.Role == "tenant_admin").ToList();
        var reviewed = await _db.Applications.AsNoTracking().Where(a => a.TenantId == id).ToListAsync();
        var counts = new Dictionary<int, int>();
        foreach (var a in reviewed)
        {
            if (a.ReviewedById != null)
                counts[a.ReviewedById.Value] = counts.GetValueOrDefault(a.ReviewedById.Value) + 1;
        }
        var ordered = filtered.OrderBy(o => o.Name, StringComparer.Ordinal).ToList();
        var data = ordered.Select(o => Mappers.MapOfficer(o, counts.GetValueOrDefault(o.Id))).ToList();
        return Ok(data);
    }

    [HttpPost("tenants/{id}/officers")]
    public async Task<ActionResult<OfficerDto>> CreateOfficer(int id, [FromBody] OfficerInput body)
    {
        if (body == null || string.IsNullOrEmpty(body.Name) || string.IsNullOrEmpty(body.Email))
            return BadRequest(new ErrorResponse { Error = "Invalid officer input" });

        var row = new User
        {
            Name = body.Name,
            Email = body.Email,
            Role = body.Role ?? "officer",
            TenantId = id,
            Status = "active",
        };
        _db.Users.Add(row);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(new AuditEntry
        {
            TenantId = id,
            ActorName = "Administrator",
            ActorRole = "tenant_admin",
            Action = "Added officer",
            RecordType = "user",
            RecordId = row.Id.ToString(),
            Outcome = "success",
            Detail = $"Granted {row.Role} access to {row.Name}",
        });

        return StatusCode(201, Mappers.MapOfficer(row, 0));
    }

    // Dashboard
    [HttpGet("tenants/{id}/dashboard")]
    public async Task<ActionResult<TenantDashboardDto>> Dashboard(int id)
    {
        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
        if (tenant == null)
            return NotFound(new ErrorResponse { Error = "Tenant not found" });

        var apps = await _db.Applications.AsNoTracking().Where(a => a.TenantId == id).ToListAsync();
        var certs = await _db.Certificates.AsNoTracking().Where(c => c.TenantId == id).ToListAsync();
        var payments = await _db.Payments.AsNoTracking().Where(p => p.TenantId == id).ToListAsync();
        var lgas = await _db.Lgas.AsNoTracking().Where(l => l.TenantId == id).ToListAsync();
        var users = await _db.Users.AsNoTracking().Where(u => u.TenantId == id).ToListAsync();
        var lgaNames = lgas.ToDictionary(l => l.Id, l => l.Name);
        var userNames = users.ToDictionary(u => u.Id, u => u.Name);

        var successfulPayments = payments.Where(p => p.Status == "success").ToList();
        var totalRevenue = successfulPayments.Sum(p => Mappers.Num(p.Amount));

        var statusOrder = new[]
        {
            "draft", "awaiting_payment", "paid", "under_review", "issued", "rejected", "revoked",
        };
        var statusMap = new Dictionary<string, int>();
        foreach (var a in apps)
            statusMap[a.Status] = statusMap.GetValueOrDefault(a.Status) + 1;
        var statusBreakdown = statusOrder
            .Where(s => statusMap.ContainsKey(s))
            .Select(s => new StatusCountDto { Status = s, Count = statusMap[s] })
            .ToList();

        var lgaMap = new Dictionary<string, int>();
        foreach (var a in apps)
        {
            var nm = a.LgaId != null && lgaNames.TryGetValue(a.LgaId.Value, out var found) ? found : "Unassigned";
            lgaMap[nm] = lgaMap.GetValueOrDefault(nm) + 1;
        }
        var lgaBreakdown = lgaMap
            .Select(kv => new LgaCountDto { LgaName = kv.Key, Count = kv.Value })
            .OrderByDescending(x => x.Count)
            .ToList();

        var now = DateTime.Now;
        var enUs = CultureInfo.GetCultureInfo("en-US");
        var monthlyTrend = new List<TrendPointDto>();
        for (int i = 5; i >= 0; i--)
        {
            var d = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var label = d.ToString("MMM", enUs);
            bool InMonth(DateTimeOffset? ts)
            {
                if (ts == null) return false;
                var local = ts.Value.LocalDateTime;
                return local.Year == d.Year && local.Month == d.Month;
            }
            monthlyTrend.Add(new TrendPointDto
            {
                Month = label,
                Applications = apps.Count(a => InMonth(a.CreatedAt)),
                Certificates = certs.Count(c => InMonth(c.IssueDate)),
            });
        }

        var pendingReview = apps.Count(a => a.Status == "paid" || a.Status == "under_review");
        var issuedCertificates = certs.Count(c => c.Status == "valid");
        var rejectedApplications = apps.Count(a => a.Status == "rejected");

        var sortedApps = apps.OrderByDescending(a => a.CreatedAt).ToList();
        var recentApplications = sortedApps.Take(6).Select(a => Mappers.MapApplication(a, new ApplicationRelations
        {
            TenantName = tenant.Name,
            ApplicantName = string.IsNullOrEmpty(Mappers.FullName(a.FirstName, a.MiddleName, a.LastName))
                ? "Applicant"
                : Mappers.FullName(a.FirstName, a.MiddleName, a.LastName),
            LgaName = a.LgaId != null && lgaNames.TryGetValue(a.LgaId.Value, out var ln) ? ln : null,
            WardName = null,
            ReviewedByName = a.ReviewedById != null && userNames.TryGetValue(a.ReviewedById.Value, out var rn) ? rn : null,
            Documents = new List<Document>(),
            Payment = null,
            Certificate = null,
        })).ToList();

        var auditRows = await _db.AuditLogs.AsNoTracking()
            .Where(a => a.TenantId == id)
            .OrderByDescending(a => a.CreatedAt)
            .Take(8)
            .ToListAsync();
        var recentActivity = auditRows.Select(r => Mappers.MapAuditLog(r, tenant.Name)).ToList();

        var data = new TenantDashboardDto
        {
            TenantId = id,
            TenantName = tenant.Name,
            TotalApplications = apps.Count,
            PendingReview = pendingReview,
            IssuedCertificates = issuedCertificates,
            RejectedApplications = rejectedApplications,
            TotalRevenue = totalRevenue,
            SuccessfulPayments = successfulPayments.Count,
            StatusBreakdown = statusBreakdown,
            LgaBreakdown = lgaBreakdown,
            MonthlyTrend = monthlyTrend,
            RecentApplications = recentApplications,
            RecentActivity = recentActivity,
        };
        return Ok(data);
    }
}
