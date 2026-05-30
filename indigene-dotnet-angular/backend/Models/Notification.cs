namespace IndigeneApi.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? ApplicationId { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public bool Read { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
