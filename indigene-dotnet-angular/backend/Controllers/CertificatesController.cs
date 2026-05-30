using IndigeneApi.Data;
using IndigeneApi.Dtos;
using IndigeneApi.Models;
using IndigeneApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndigeneApi.Controllers;

[ApiController]
[Route("api")]
public class CertificatesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _audit;

    public CertificatesController(AppDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet("certificates/{id}")]
    public async Task<ActionResult<CertificateDto>> Get(int id)
    {
        var row = await _db.Certificates.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (row == null)
            return NotFound(new ErrorResponse { Error = "Certificate not found" });
        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == row.TenantId);
        return Ok(Mappers.MapCertificate(row, tenant?.Name));
    }

    [HttpPost("certificates/{id}/revoke")]
    public async Task<ActionResult<CertificateDto>> Revoke(int id, [FromBody] RevokeInput body)
    {
        if (body == null || string.IsNullOrEmpty(body.Reason))
            return BadRequest(new ErrorResponse { Error = "reason is required" });

        var row = await _db.Certificates.FirstOrDefaultAsync(c => c.Id == id);
        if (row == null)
            return NotFound(new ErrorResponse { Error = "Certificate not found" });

        row.Status = "revoked";
        row.RevokedReason = body.Reason;

        var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == row.ApplicationId);
        if (app != null)
        {
            app.Status = "revoked";
            app.UpdatedAt = DateTimeOffset.UtcNow;
            _db.Notifications.Add(new Notification
            {
                UserId = app.ApplicantId,
                ApplicationId = app.Id,
                Type = "revoked",
                Title = "Certificate revoked",
                Message = $"Certificate {row.CertificateNumber} has been revoked. {body.Reason}",
            });
        }

        await _db.SaveChangesAsync();

        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == row.TenantId);
        await _audit.RecordAsync(new AuditEntry
        {
            TenantId = row.TenantId,
            ActorName = "Issuing Officer",
            ActorRole = "officer",
            Action = "Revoked certificate",
            RecordType = "certificate",
            RecordId = row.CertificateNumber,
            Outcome = "revoked",
            Detail = body.Reason,
        });

        return Ok(Mappers.MapCertificate(row, tenant?.Name));
    }

    // PUBLIC: certificateNumber contains slashes (e.g. "LAG/2026/00001"). A catch-all
    // route template {*certificateNumber} captures the full path segment including the
    // slashes. The Angular client URL-encodes the value; ASP.NET Core decodes it before
    // it reaches this action, so an exact-match lookup works in both cases.
    [HttpGet("verify/{*certificateNumber}")]
    public async Task<ActionResult<VerificationResultDto>> Verify(string certificateNumber)
    {
        var row = await _db.Certificates.AsNoTracking()
            .FirstOrDefaultAsync(c => c.CertificateNumber == certificateNumber);

        if (row == null)
        {
            return Ok(new VerificationResultDto
            {
                Found = false,
                Status = "not_found",
                Result = "No certificate matches this number. It may be invalid or fraudulent.",
                CertificateNumber = certificateNumber,
            });
        }

        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == row.TenantId);
        var isValid = row.Status == "valid";
        return Ok(new VerificationResultDto
        {
            Found = true,
            Status = row.Status,
            Result = isValid
                ? "This is a genuine, valid indigene certificate."
                : "This certificate has been revoked and is no longer valid.",
            CertificateNumber = row.CertificateNumber,
            ApplicantDisplayName = row.ApplicantDisplayName,
            TenantName = tenant?.Name,
            LgaName = row.LgaName,
            StateOfOrigin = row.StateOfOrigin,
            IssueDate = Mappers.Iso(row.IssueDate),
        });
    }
}
