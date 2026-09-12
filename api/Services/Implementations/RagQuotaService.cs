using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;
using MilLib.Models.DTOs.Ai;
using MilLib.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class RagQuotaService : IRagQuotaService
    {
        private readonly IMemoryCache _cache;
        private const int GuestDailyLimit = 3;
        private const int UserDailyLimit = 10;

        public RagQuotaService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public Task<RagQuotaDto> GetQuotaAsync(ClaimsPrincipal user, string? deviceId, string? ipAddress)
        {
            var now = DateTime.UtcNow;
            var resetAt = now.Date.AddDays(1);
            var secondsUntilReset = Math.Max(0, (int)(resetAt - now).TotalSeconds);

            // 1. Admin: Unlimited
            if (IsAdmin(user))
            {
                return Task.FromResult(new RagQuotaDto
                {
                    DailyLimit = null,
                    Remaining = null,
                    Used = 0,
                    IsUnlimited = true,
                    ResetAt = resetAt,
                    SecondsUntilReset = secondsUntilReset
                });
            }

            // 2. Regular User or Guest
            var (cacheKey, dailyLimit) = GetQuotaKeyAndLimit(user, deviceId, ipAddress);
            var used = _cache.TryGetValue(cacheKey, out int currentUsed) ? currentUsed : 0;
            var remaining = Math.Max(0, dailyLimit - used);

            return Task.FromResult(new RagQuotaDto
            {
                DailyLimit = dailyLimit,
                Remaining = remaining,
                Used = used,
                IsUnlimited = false,
                ResetAt = resetAt,
                SecondsUntilReset = secondsUntilReset
            });
        }

        public Task<(bool IsAllowed, RagQuotaDto Quota)> TryConsumeQuotaAsync(ClaimsPrincipal user, string? deviceId, string? ipAddress)
        {
            var now = DateTime.UtcNow;
            var resetAt = now.Date.AddDays(1);
            var secondsUntilReset = Math.Max(0, (int)(resetAt - now).TotalSeconds);

            // 1. Admin: Always allowed without limits
            if (IsAdmin(user))
            {
                var adminQuota = new RagQuotaDto
                {
                    DailyLimit = null,
                    Remaining = null,
                    Used = 0,
                    IsUnlimited = true,
                    ResetAt = resetAt,
                    SecondsUntilReset = secondsUntilReset
                };
                return Task.FromResult((true, adminQuota));
            }

            // 2. Regular User or Guest
            var (cacheKey, dailyLimit) = GetQuotaKeyAndLimit(user, deviceId, ipAddress);

            lock (string.Intern(cacheKey))
            {
                var used = _cache.TryGetValue(cacheKey, out int currentUsed) ? currentUsed : 0;

                if (used >= dailyLimit)
                {
                    var exhaustedQuota = new RagQuotaDto
                    {
                        DailyLimit = dailyLimit,
                        Remaining = 0,
                        Used = used,
                        IsUnlimited = false,
                        ResetAt = resetAt,
                        SecondsUntilReset = secondsUntilReset
                    };
                    return Task.FromResult((false, exhaustedQuota));
                }

                var updatedUsed = used + 1;
                _cache.Set(cacheKey, updatedUsed, resetAt);

                var updatedQuota = new RagQuotaDto
                {
                    DailyLimit = dailyLimit,
                    Remaining = Math.Max(0, dailyLimit - updatedUsed),
                    Used = updatedUsed,
                    IsUnlimited = false,
                    ResetAt = resetAt,
                    SecondsUntilReset = secondsUntilReset
                };

                return Task.FromResult((true, updatedQuota));
            }
        }

        private static bool IsAdmin(ClaimsPrincipal user)
        {
            return user.Identity?.IsAuthenticated == true &&
                   (user.IsInRole("Admin") || user.HasClaim(ClaimTypes.Role, "Admin"));
        }

        private static (string Key, int Limit) GetQuotaKeyAndLimit(ClaimsPrincipal user, string? deviceId, string? ipAddress)
        {
            if (user.Identity?.IsAuthenticated == true)
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? user.FindFirst("sub")?.Value
                    ?? user.Identity.Name
                    ?? "unknown_user";
                return ($"rag_quota_user_{userId}", UserDailyLimit);
            }

            if (!string.IsNullOrWhiteSpace(deviceId))
            {
                return ($"rag_quota_guest_dev_{deviceId.Trim()}", GuestDailyLimit);
            }

            var safeIp = string.IsNullOrWhiteSpace(ipAddress) ? "anonymous" : ipAddress.Trim();
            return ($"rag_quota_guest_ip_{safeIp}", GuestDailyLimit);
        }
    }
}
