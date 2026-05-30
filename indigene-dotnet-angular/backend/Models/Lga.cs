namespace IndigeneApi.Models;

public class Lga
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = null!;
    public string? Code { get; set; }
}
