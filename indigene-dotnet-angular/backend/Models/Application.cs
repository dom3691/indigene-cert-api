namespace IndigeneApi.Models;

public class Application
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ApplicantId { get; set; }
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
    public string Status { get; set; } = "draft";
    public string? RejectionReason { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public int? ReviewedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
