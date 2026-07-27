using System.Diagnostics;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace MilLib.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [EnableRateLimiting("HealthCheckLimiter")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        public HealthController(
            ApplicationDbContext context, 
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("/health")]
        [HttpGet("api/health")]
        public async Task<IActionResult> GetHealth()
        {
            var checks = new Dictionary<string, object>();
            bool isOverallHealthy = true;

            // 1. API Runtime Self Check (Process memory, Uptime, .NET version)
            try
            {
                var process = Process.GetCurrentProcess();
                var uptime = DateTime.UtcNow - process.StartTime.ToUniversalTime();
                var memoryMb = Math.Round(process.WorkingSet64 / (1024.0 * 1024.0), 2);

                checks["api"] = new
                {
                    status = "Healthy",
                    message = "ASP.NET Core API server is online and processing requests",
                    uptime = $"{uptime.Days}d {uptime.Hours}h {uptime.Minutes}m {uptime.Seconds}s",
                    memoryAllocatedMb = memoryMb,
                    dotnetVersion = Environment.Version.ToString(),
                    environment = _configuration["RAILWAY_ENVIRONMENT"] ?? _configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production"
                };
            }
            catch (Exception ex)
            {
                checks["api"] = new
                {
                    status = "Unhealthy",
                    message = $"API self-check failed: {ex.Message}"
                };
                isOverallHealthy = false;
            }

            // 2. Supabase (Ping DB to reset 7-day inactivity timer)
            var supabaseSw = Stopwatch.StartNew();
            try
            {
                // ExecuteSqlRawAsync executes an actual SQL query on PostgreSQL/Supabase to prevent auto-pausing
                await _context.Database.ExecuteSqlRawAsync("SELECT 1;");
                supabaseSw.Stop();
                checks["supabase"] = new
                {
                    status = "Healthy",
                    message = "Supabase PostgreSQL active (SELECT 1 executed)",
                    latencyMs = supabaseSw.ElapsedMilliseconds
                };
            }
            catch (Exception ex)
            {
                supabaseSw.Stop();
                isOverallHealthy = false;
                checks["supabase"] = new
                {
                    status = "Unhealthy",
                    message = $"Supabase ping failed: {ex.Message}",
                    latencyMs = supabaseSw.ElapsedMilliseconds
                };
            }

            // 3. Backblaze B2 (S3 bucket connectivity)
            var backblazeSw = Stopwatch.StartNew();
            try
            {
                var options = _configuration.GetSection("Backblaze");
                var keyId = options["KeyId"];
                var applicationKey = options["ApplicationKey"];
                var bucketName = options["BucketName"];
                var serviceUrl = options["ServiceUrl"];

                if (!string.IsNullOrWhiteSpace(keyId) &&
                    !string.IsNullOrWhiteSpace(applicationKey) &&
                    !string.IsNullOrWhiteSpace(serviceUrl) &&
                    !string.IsNullOrWhiteSpace(bucketName))
                {
                    var s3Config = new AmazonS3Config { ServiceURL = serviceUrl };
                    using var s3Client = new AmazonS3Client(keyId, applicationKey, s3Config);

                    var request = new ListObjectsV2Request
                    {
                        BucketName = bucketName,
                        MaxKeys = 1
                    };
                    await s3Client.ListObjectsV2Async(request);
                    backblazeSw.Stop();

                    checks["backblaze"] = new
                    {
                        status = "Healthy",
                        message = $"Backblaze B2 bucket '{bucketName}' accessible",
                        latencyMs = backblazeSw.ElapsedMilliseconds
                    };
                }
                else
                {
                    backblazeSw.Stop();
                    checks["backblaze"] = new
                    {
                        status = "Healthy",
                        message = "Backblaze parameters omitted or not configured; skipped live test",
                        latencyMs = backblazeSw.ElapsedMilliseconds
                    };
                }
            }
            catch (Exception ex)
            {
                backblazeSw.Stop();
                isOverallHealthy = false;
                checks["backblaze"] = new
                {
                    status = "Unhealthy",
                    message = $"Backblaze B2 ping failed: {ex.Message}",
                    latencyMs = backblazeSw.ElapsedMilliseconds
                };
            }

            // 4. Railway AI Microservice Ping
            var railwaySw = Stopwatch.StartNew();
            bool railwayOk = true;
            string railwayMessage = "";
            var aiServiceUrl = _configuration["AI_SERVICE_URL"] ?? "http://localhost:8000";

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                
                // Ping the Railway AI Service endpoint
                var response = await client.GetAsync($"{aiServiceUrl.TrimEnd('/')}/docs");
                railwaySw.Stop();

                if (response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    railwayOk = true;
                    railwayMessage = $"Railway AI Service ping successful ({aiServiceUrl}, HTTP {(int)response.StatusCode})";
                }
                else
                {
                    railwayOk = false;
                    railwayMessage = $"Railway AI Service returned status HTTP {(int)response.StatusCode}";
                }
            }
            catch (Exception ex)
            {
                railwaySw.Stop();
                railwayOk = false;
                railwayMessage = $"Railway AI Service ping failed ({aiServiceUrl}): {ex.Message}";
            }

            checks["railway_ai_service"] = new
            {
                status = railwayOk ? "Healthy" : "Degraded",
                message = railwayMessage,
                aiServiceUrl = aiServiceUrl,
                latencyMs = railwaySw.ElapsedMilliseconds
            };

            var result = new
            {
                status = isOverallHealthy ? "Healthy" : "Unhealthy",
                timestamp = DateTime.UtcNow,
                checks
            };

            if (isOverallHealthy)
            {
                return Ok(result);
            }

            return StatusCode(StatusCodes.Status503ServiceUnavailable, result);
        }
    }
}
