using IndigeneApi.Data;
using IndigeneApi.Dtos;
using IndigeneApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IndigeneApi.Controllers;

[ApiController]
[Route("api")]
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AccountsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("accounts")]
    public async Task<ActionResult<List<AccountDto>>> List()
    {
        var users = await _db.Users.AsNoTracking().OrderBy(u => u.Id).ToListAsync();
        var tenants = await _db.Tenants.AsNoTracking().ToListAsync();
        var tenantNames = tenants.ToDictionary(t => t.Id, t => t.Name);
        var data = users.Select(u =>
            Mappers.MapAccount(u, u.TenantId != null && tenantNames.TryGetValue(u.TenantId.Value, out var n) ? n : null))
            .ToList();
        return Ok(data);
    }
}
