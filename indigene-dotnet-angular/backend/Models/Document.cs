namespace IndigeneApi.Models;

public class Document
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public int? SizeKb { get; set; }
    public DateTimeOffset UploadedAt { get; set; }
}
