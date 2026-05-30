namespace IndigeneApi.Models;

public class Payment
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int TenantId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "NGN";
    public string Reference { get; set; } = null!;
    public string? Gateway { get; set; }
    public string Status { get; set; } = "success";
    public string? PayerName { get; set; }
    public string? ReceiptNumber { get; set; }
    public DateTimeOffset PaidAt { get; set; }
}
