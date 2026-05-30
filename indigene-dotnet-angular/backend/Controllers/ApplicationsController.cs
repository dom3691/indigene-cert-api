using IndigeneApi.Data;
using IndigeneApi.Dtos;
using IndigeneApi.Models;
using IndigeneApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndigeneApi.Controllers;

[ApiController]
[Route("api")]
public class ApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly RelationsBuilder _relations;
    private readonly AuditService _audit;

    private static readonly string[] ApplicationStatuses =
    {
        "draft", "awaiting_payment", "paid", "under_review", "issued", "rejected", "revoked",
    };

    public ApplicationsController(AppDbContext db, RelationsBuilder relations, AuditService audit)
    {
        _db = db;
        _relations = relations;
        _audit = audit;
    }

    [HttpGet("applications")]
    public async Task<ActionResult<List<ApplicationDto>>> List(
        [FromQuery] int? applicantId,
        [FromQuery] int? tenantId,
        [FromQuery] string? status,
        [FromQuery] int? lgaId,
        [FromQuery] int? officerId,
        [FromQuery] string? search)
    {
        var query = _db.Applications.AsNoTracking().AsQueryable();
        if (applicantId != null) query = query.Where(a => a.ApplicantId == applicantId);
        if (tenantId != null) query = query.Where(a => a.TenantId == tenantId);
        if (!string.IsNullOrEmpty(status)) query = query.Where(a => a.Status == status);
        if (lgaId != null) query = query.Where(a => a.LgaId == lgaId);
        if (officerId != null) query = query.Where(a => a.ReviewedById == officerId);

        var rows = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        var dtos = await _relations.BuildApplicationDtosAsync(rows);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            dtos = dtos.Where(d =>
                d.ApplicantName.ToLowerInvariant().Contains(term) ||
                (d.Nin ?? "").ToLowerInvariant().Contains(term) ||
                (d.Email ?? "").ToLowerInvariant().Contains(term) ||
                (d.Certificate?.CertificateNumber ?? "").ToLowerInvariant().Contains(term))
                .ToList();
        }

        return Ok(dtos);
    }

    [HttpPost("applications")]
    public async Task<ActionResult<ApplicationDto>> Create([FromBody] ApplicationInput body)
    {
        if (body == null || body.TenantId == null || body.ApplicantId == null)
            return BadRequest(new ErrorResponse { Error = "tenantId and applicantId are required" });

        var row = new Application
        {
            TenantId = body.TenantId.Value,
            ApplicantId = body.ApplicantId.Value,
            FirstName = body.FirstName,
            MiddleName = body.MiddleName,
            LastName = body.LastName,
            Gender = body.Gender,
            DateOfBirth = body.DateOfBirth,
            Nin = body.Nin,
            Email = body.Email,
            Phone = body.Phone,
            ResidentialAddress = body.ResidentialAddress,
            StateOfOrigin = body.StateOfOrigin,
            LgaId = body.LgaId,
            WardId = body.WardId,
            FatherName = body.FatherName,
            MotherName = body.MotherName,
            Community = body.Community,
            Status = "draft",
        };
        _db.Applications.Add(row);
        await _db.SaveChangesAsync();

        var dto = await _relations.BuildApplicationDtoAsync(row);
        return StatusCode(201, dto);
    }

    [HttpGet("applications/{id}")]
    public async Task<ActionResult<ApplicationDto>> Get(int id)
    {
        var row = await _db.Applications.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (row == null)
            return NotFound(new ErrorResponse { Error = "Application not found" });
        var dto = await _relations.BuildApplicationDtoAsync(row);
        return Ok(dto);
    }

    [HttpPatch("applications/{id}")]
    public async Task<ActionResult<ApplicationDto>> Update(int id, [FromBody] ApplicationUpdate body)
    {
        var current = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id);
        if (current == null)
            return NotFound(new ErrorResponse { Error = "Application not found" });

        if (body.Status != null)
        {
            if (!ApplicationStatuses.Contains(body.Status))
                return BadRequest(new ErrorResponse { Error = $"Invalid status: {body.Status}" });

            // The self-service endpoint may only submit a draft for payment.
            // Officer-driven transitions (approve/reject) and payment use dedicated endpoints.
            var isSubmit = current.Status == "draft" && body.Status == "awaiting_payment";
            var isNoop = body.Status == current.Status;
            if (!isSubmit && !isNoop)
            {
                return Conflict(new ErrorResponse
                {
                    Error = $"Cannot change status from {current.Status} to {body.Status} via this endpoint",
                });
            }
        }

        // Applicant details may only be edited while the application is still a draft.
        var editsDetails =
            body.FirstName != null || body.MiddleName != null || body.LastName != null ||
            body.Gender != null || body.DateOfBirth != null || body.Nin != null ||
            body.Email != null || body.Phone != null || body.ResidentialAddress != null ||
            body.StateOfOrigin != null || body.LgaId != null || body.WardId != null ||
            body.FatherName != null || body.MotherName != null || body.Community != null;
        if (editsDetails && current.Status != "draft")
        {
            return Conflict(new ErrorResponse { Error = "Application details can only be edited while in draft" });
        }

        if (body.FirstName != null) current.FirstName = body.FirstName;
        if (body.MiddleName != null) current.MiddleName = body.MiddleName;
        if (body.LastName != null) current.LastName = body.LastName;
        if (body.Gender != null) current.Gender = body.Gender;
        if (body.DateOfBirth != null) current.DateOfBirth = body.DateOfBirth;
        if (body.Nin != null) current.Nin = body.Nin;
        if (body.Email != null) current.Email = body.Email;
        if (body.Phone != null) current.Phone = body.Phone;
        if (body.ResidentialAddress != null) current.ResidentialAddress = body.ResidentialAddress;
        if (body.StateOfOrigin != null) current.StateOfOrigin = body.StateOfOrigin;
        if (body.LgaId != null) current.LgaId = body.LgaId;
        if (body.WardId != null) current.WardId = body.WardId;
        if (body.FatherName != null) current.FatherName = body.FatherName;
        if (body.MotherName != null) current.MotherName = body.MotherName;
        if (body.Community != null) current.Community = body.Community;
        if (body.Status != null) current.Status = body.Status;

        if (body.Status == "awaiting_payment")
            current.SubmittedAt = DateTimeOffset.UtcNow;

        current.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        if (body.Status == "awaiting_payment")
        {
            await _audit.RecordAsync(new AuditEntry
            {
                TenantId = current.TenantId,
                ActorName = await _relations.ApplicantDisplayNameAsync(current),
                ActorRole = "applicant",
                Action = "Submitted application",
                RecordType = "application",
                RecordId = current.Id.ToString(),
                Outcome = "success",
                Detail = "Application submitted, awaiting payment",
            });
        }

        var dto = await _relations.BuildApplicationDtoAsync(current);
        return Ok(dto);
    }

    [HttpPost("applications/{id}/documents")]
    public async Task<ActionResult<DocumentDto>> AddDocument(int id, [FromBody] DocumentInput body)
    {
        if (body == null || string.IsNullOrEmpty(body.Name) || string.IsNullOrEmpty(body.Type)
            || string.IsNullOrEmpty(body.FileName))
            return BadRequest(new ErrorResponse { Error = "Invalid document input" });

        var row = new Document
        {
            ApplicationId = id,
            Name = body.Name,
            Type = body.Type,
            FileName = body.FileName,
            SizeKb = body.SizeKb,
        };
        _db.Documents.Add(row);
        await _db.SaveChangesAsync();
        return StatusCode(201, Mappers.MapDocument(row));
    }

    [HttpPost("applications/{id}/pay")]
    public async Task<ActionResult<ApplicationDto>> Pay(int id, [FromBody] PaymentInput body)
    {
        if (body == null || string.IsNullOrEmpty(body.PayerName))
            return BadRequest(new ErrorResponse { Error = "payerName is required" });

        var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id);
        if (app == null)
            return NotFound(new ErrorResponse { Error = "Application not found" });

        if (app.Status != "awaiting_payment")
        {
            return Conflict(new ErrorResponse
            {
                Error = $"Payment is only allowed while awaiting payment (current status: {app.Status})",
            });
        }

        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == app.TenantId);
        var fee = tenant != null ? Mappers.Num(tenant.Fee) : 0m;
        var currency = tenant?.Currency ?? "NGN";

        var existing = await _db.Payments.AnyAsync(p => p.ApplicationId == app.Id);
        if (!existing)
        {
            _db.Payments.Add(new Payment
            {
                ApplicationId = app.Id,
                TenantId = app.TenantId,
                Amount = fee,
                Currency = currency,
                Reference = Utils.Ref("PAY"),
                Gateway = body.Method ?? "Card",
                Status = "success",
                PayerName = body.PayerName,
                ReceiptNumber = Utils.Ref("RCPT"),
            });
        }

        app.Status = "paid";
        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(new AuditEntry
        {
            TenantId = app.TenantId,
            ActorName = body.PayerName,
            ActorRole = "applicant",
            Action = "Paid application fee",
            RecordType = "payment",
            RecordId = app.Id.ToString(),
            Outcome = "success",
            Detail = $"{currency} {Utils.FormatThousands(fee)} received",
        });

        var dto = await _relations.BuildApplicationDtoAsync(app);
        return Ok(dto);
    }

    [HttpPost("applications/{id}/approve")]
    public async Task<ActionResult<ApplicationDto>> Approve(int id, [FromBody] ApprovalInput body)
    {
        if (body == null || body.OfficerId == null)
            return BadRequest(new ErrorResponse { Error = "officerId is required" });

        var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id);
        if (app == null)
            return NotFound(new ErrorResponse { Error = "Application not found" });

        if (app.Status != "paid" && app.Status != "under_review" && app.Status != "revoked")
        {
            return Conflict(new ErrorResponse
            {
                Error = $"Only paid, under-review, or revoked applications can be approved (current status: {app.Status})",
            });
        }

        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == app.TenantId);
        var officer = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == body.OfficerId);
        if (officer == null || officer.TenantId != app.TenantId || officer.Role != "officer")
        {
            return StatusCode(403, new ErrorResponse { Error = "Officer is not authorized to issue for this tenant" });
        }

        string? lgaName = null;
        string? wardName = null;
        if (app.LgaId != null)
        {
            var lga = await _db.Lgas.AsNoTracking().FirstOrDefaultAsync(l => l.Id == app.LgaId);
            lgaName = lga?.Name;
        }
        if (app.WardId != null)
        {
            var ward = await _db.Wards.AsNoTracking().FirstOrDefaultAsync(w => w.Id == app.WardId);
            wardName = ward?.Name;
        }

        var displayName = await _relations.ApplicantDisplayNameAsync(app);
        var reviewedAt = DateTimeOffset.UtcNow;

        var cert = await _db.Certificates.FirstOrDefaultAsync(c => c.ApplicationId == app.Id);
        if (cert == null)
        {
            var prefix = tenant?.CertificatePrefix ?? "CERT";
            var year = reviewedAt.Year;
            var serial = app.Id.ToString().PadLeft(5, '0');
            var certificateNumber = $"{prefix}/{year}/{serial}";
            cert = new Certificate
            {
                ApplicationId = app.Id,
                TenantId = app.TenantId,
                CertificateNumber = certificateNumber,
                ApplicantDisplayName = displayName,
                LgaName = lgaName,
                WardName = wardName,
                StateOfOrigin = app.StateOfOrigin ?? tenant?.Name,
                Status = "valid",
                IssuedById = officer.Id,
                IssuedByName = officer.Name,
            };
            _db.Certificates.Add(cert);
        }
        else if (cert.Status != "valid")
        {
            // Re-approving a previously revoked application restores its certificate in place.
            cert.Status = "valid";
            cert.RevokedReason = null;
            cert.IssuedById = officer.Id;
            cert.IssuedByName = officer.Name;
        }

        app.Status = "issued";
        app.ReviewedById = body.OfficerId;
        app.ReviewedAt = reviewedAt;
        app.RejectionReason = null;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        _db.Notifications.Add(new Notification
        {
            UserId = app.ApplicantId,
            ApplicationId = app.Id,
            Type = "approved",
            Title = "Certificate issued",
            Message = $"Your indigene certificate {cert.CertificateNumber} has been issued.",
        });

        await _db.SaveChangesAsync();

        await _audit.RecordAsync(new AuditEntry
        {
            TenantId = app.TenantId,
            ActorName = officer.Name,
            ActorRole = "officer",
            Action = "Approved application",
            RecordType = "certificate",
            RecordId = cert.CertificateNumber,
            Outcome = "issued",
            Detail = $"Issued certificate to {displayName}",
        });

        var dto = await _relations.BuildApplicationDtoAsync(app);
        return Ok(dto);
    }

    [HttpPost("applications/{id}/reject")]
    public async Task<ActionResult<ApplicationDto>> Reject(int id, [FromBody] RejectionInput body)
    {
        if (body == null || body.OfficerId == null || string.IsNullOrEmpty(body.Reason))
            return BadRequest(new ErrorResponse { Error = "officerId and reason are required" });

        var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id);
        if (app == null)
            return NotFound(new ErrorResponse { Error = "Application not found" });

        if (app.Status != "paid" && app.Status != "under_review")
        {
            return Conflict(new ErrorResponse
            {
                Error = $"Only paid applications under review can be rejected (current status: {app.Status})",
            });
        }

        var officer = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == body.OfficerId);
        if (officer == null || officer.TenantId != app.TenantId || officer.Role != "officer")
        {
            return StatusCode(403, new ErrorResponse { Error = "Officer is not authorized to review for this tenant" });
        }

        app.Status = "rejected";
        app.ReviewedById = body.OfficerId;
        app.ReviewedAt = DateTimeOffset.UtcNow;
        app.RejectionReason = body.Reason;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        _db.Notifications.Add(new Notification
        {
            UserId = app.ApplicantId,
            ApplicationId = app.Id,
            Type = "rejected",
            Title = "Application rejected",
            Message = body.Reason,
        });

        await _db.SaveChangesAsync();

        await _audit.RecordAsync(new AuditEntry
        {
            TenantId = app.TenantId,
            ActorName = officer.Name,
            ActorRole = "officer",
            Action = "Rejected application",
            RecordType = "application",
            RecordId = app.Id.ToString(),
            Outcome = "rejected",
            Detail = body.Reason,
        });

        var dto = await _relations.BuildApplicationDtoAsync(app);
        return Ok(dto);
    }
}
