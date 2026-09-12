using System.Security.Claims;
using MilLib.Models.DTOs.Ai;

namespace MilLib.Services.Interfaces
{
    public interface IRagQuotaService
    {
        Task<RagQuotaDto> GetQuotaAsync(ClaimsPrincipal user, string? deviceId, string? ipAddress);
        Task<(bool IsAllowed, RagQuotaDto Quota)> TryConsumeQuotaAsync(ClaimsPrincipal user, string? deviceId, string? ipAddress);
    }
}
