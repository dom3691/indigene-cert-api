using System.Globalization;
using System.Text;

namespace IndigeneApi.Services;

public static class Utils
{
    private static readonly Random Rng = new();

    public static string Ref(string prefix)
    {
        var ms = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var ts = ToBase36(ms).ToUpperInvariant();
        var rand = Rng.Next(1000, 10000);
        return $"{prefix}-{ts}-{rand}";
    }

    public static string Slugify(string s)
    {
        var lower = s.ToLowerInvariant();
        var sb = new StringBuilder();
        foreach (var ch in lower)
        {
            if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9'))
                sb.Append(ch);
            else
                sb.Append('-');
        }
        var collapsed = new StringBuilder();
        bool prevDash = false;
        foreach (var ch in sb.ToString())
        {
            if (ch == '-')
            {
                if (!prevDash) collapsed.Append('-');
                prevDash = true;
            }
            else
            {
                collapsed.Append(ch);
                prevDash = false;
            }
        }
        return collapsed.ToString().Trim('-');
    }

    private static string ToBase36(long value)
    {
        const string chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        if (value == 0) return "0";
        var sb = new StringBuilder();
        var v = value;
        while (v > 0)
        {
            sb.Insert(0, chars[(int)(v % 36)]);
            v /= 36;
        }
        return sb.ToString();
    }

    public static string FormatThousands(decimal value)
    {
        return value.ToString("#,##0.###", CultureInfo.InvariantCulture);
    }
}
