using IndigeneApi.Data;
using IndigeneApi.Dtos;
using IndigeneApi.Models;
using Microsoft.EntityFrameworkCore;

namespace IndigeneApi.Services;

public class RelationsBuilder
{
    private readonly AppDbContext _db;

    public RelationsBuilder(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ApplicationDto>> BuildApplicationDtosAsync(IReadOnlyList<Application> apps)
    {
        if (apps.Count == 0) return new List<ApplicationDto>();
        var ids = apps.Select(a => a.Id).ToList();

        var tenants = await _db.Tenants.AsNoTracking().ToListAsync();
        var lgas = await _db.Lgas.AsNoTracking().ToListAsync();
        var wards = await _db.Wards.AsNoTracking().ToListAsync();
        var users = await _db.Users.AsNoTracking().ToListAsync();
        var documents = await _db.Documents.AsNoTracking()
            .Where(d => ids.Contains(d.ApplicationId)).ToListAsync();
        var payments = await _db.Payments.AsNoTracking()
            .Where(p => ids.Contains(p.ApplicationId)).ToListAsync();
        var certificates = await _db.Certificates.AsNoTracking()
            .Where(c => ids.Contains(c.ApplicationId)).ToListAsync();

        var tenantNames = tenants.ToDictionary(t => t.Id, t => t.Name);
        var lgaNames = lgas.ToDictionary(l => l.Id, l => l.Name);
        var wardNames = wards.ToDictionary(w => w.Id, w => w.Name);
        var userNames = users.ToDictionary(u => u.Id, u => u.Name);

        return apps.Select(a =>
        {
            var rel = new ApplicationRelations
            {
                TenantName = tenantNames.TryGetValue(a.TenantId, out var tn) ? tn : null,
                ApplicantName = ResolveApplicantName(a, userNames),
                LgaName = a.LgaId != null && lgaNames.TryGetValue(a.LgaId.Value, out var ln) ? ln : null,
                WardName = a.WardId != null && wardNames.TryGetValue(a.WardId.Value, out var wn) ? wn : null,
                ReviewedByName = a.ReviewedById != null && userNames.TryGetValue(a.ReviewedById.Value, out var rn) ? rn : null,
                Documents = documents.Where(d => d.ApplicationId == a.Id).ToList(),
                Payment = payments.FirstOrDefault(p => p.ApplicationId == a.Id),
                Certificate = certificates.FirstOrDefault(c => c.ApplicationId == a.Id),
            };
            return Mappers.MapApplication(a, rel);
        }).ToList();
    }

    public async Task<ApplicationDto> BuildApplicationDtoAsync(Application app)
    {
        var list = await BuildApplicationDtosAsync(new[] { app });
        return list[0];
    }

    public async Task<string> ApplicantDisplayNameAsync(Application app)
    {
        var name = Mappers.FullName(app.FirstName, app.MiddleName, app.LastName);
        if (!string.IsNullOrEmpty(name)) return name;
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == app.ApplicantId);
        return user?.Name ?? "Applicant";
    }

    private static string ResolveApplicantName(Application a, IReadOnlyDictionary<int, string> userNames)
    {
        var full = Mappers.FullName(a.FirstName, a.MiddleName, a.LastName);
        if (!string.IsNullOrEmpty(full)) return full;
        if (userNames.TryGetValue(a.ApplicantId, out var un) && !string.IsNullOrEmpty(un)) return un;
        return "Applicant";
    }
}
