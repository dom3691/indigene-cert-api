namespace IndigeneApi.Dtos;

public class TenantInput
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? CertificatePrefix { get; set; }
    public decimal? Fee { get; set; }
    public string? Currency { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? Capital { get; set; }
    public string? PrimaryColor { get; set; }
    public string? Tagline { get; set; }
}

public class TenantUpdate
{
    public string? Name { get; set; }
    public string? CertificatePrefix { get; set; }
    public decimal? Fee { get; set; }
    public string? Currency { get; set; }
    public string? Status { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? Capital { get; set; }
    public string? PrimaryColor { get; set; }
    public string? Tagline { get; set; }
}

public class ApplicationInput
{
    public int? TenantId { get; set; }
    public int? ApplicantId { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? Gender { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Nin { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? ResidentialAddress { get; set; }
    public string? StateOfOrigin { get; set; }
    public int? LgaId { get; set; }
    public int? WardId { get; set; }
    public string? FatherName { get; set; }
    public string? MotherName { get; set; }
    public string? Community { get; set; }
}

public class ApplicationUpdate
{
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? Gender { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Nin { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? ResidentialAddress { get; set; }
    public string? StateOfOrigin { get; set; }
    public int? LgaId { get; set; }
    public int? WardId { get; set; }
    public string? FatherName { get; set; }
    public string? MotherName { get; set; }
    public string? Community { get; set; }
    public string? Status { get; set; }
}

public class DocumentInput
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? FileName { get; set; }
    public int? SizeKb { get; set; }
}

public class PaymentInput
{
    public string? PayerName { get; set; }
    public string? Method { get; set; }
}

public class ApprovalInput
{
    public int? OfficerId { get; set; }
    public string? Note { get; set; }
}

public class RejectionInput
{
    public int? OfficerId { get; set; }
    public string? Reason { get; set; }
}

public class RevokeInput
{
    public string? Reason { get; set; }
}

public class LgaInput
{
    public string? Name { get; set; }
    public string? Code { get; set; }
}

public class WardInput
{
    public string? Name { get; set; }
}

public class OfficerInput
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
}
