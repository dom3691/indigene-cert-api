using IndigeneApi.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace IndigeneApi.Controllers;

[ApiController]
[Route("api")]
public class HealthController : ControllerBase
{
    [HttpGet("healthz")]
    public ActionResult<HealthStatusDto> Get()
    {
        return Ok(new HealthStatusDto { Status = "ok" });
    }
}
