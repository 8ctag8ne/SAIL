//api/Controllers/AiController.cs
using Microsoft.AspNetCore.Mvc;
using MilLib.Models.DTOs.Ai;
using System.Text.Json;
using System.Text;


namespace MilLib.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public AiController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        // 1. Ендпоїнт для завантаження файлу
        [HttpPost("upload-to-convert")]
        public async Task<IActionResult> UploadPdf(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл порожній");

            var client = _httpClientFactory.CreateClient("AiService");

            // Формуємо Multipart запит (так само, як це робить браузер)
            using var content = new MultipartFormDataContent();
            using var stream = file.OpenReadStream();
            var streamContent = new StreamContent(stream);
            
            // ВАЖЛИВО: Назва поля "file" має збігатися з параметром `file: UploadFile` у FastAPI
            content.Add(streamContent, "file", file.FileName);

            // Відправляємо POST у Python
            var response = await client.PostAsync("rag/convert-to-md/upload", content);
            
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "Помилка комунікації з AI сервісом");

            var responseData = await response.Content.ReadAsStringAsync();
            
            // Повертаємо JSON з task_id на фронтенд (чи в Swagger)
            return Content(responseData, "application/json");
        }

        // 2. Ендпоїнт для перевірки статусу
        [HttpGet("status/{taskId}")]
        public async Task<IActionResult> CheckStatus(string taskId)
        {
            var client = _httpClientFactory.CreateClient("AiService");
            
            // Відправляємо GET у Python
            var response = await client.GetAsync($"rag/convert-to-md/status/{taskId}");
            
            if (!response.IsSuccessStatusCode)
                return NotFound("Задачу не знайдено");

            var responseData = await response.Content.ReadAsStringAsync();
            return Content(responseData, "application/json");
        }

        [HttpGet("hello")]
        public async Task<IActionResult> SayHello()
        {
            var client = _httpClientFactory.CreateClient("AiService");
            
            // Відправляємо GET у Python
            var response = await client.GetAsync($"/");
            
            if (!response.IsSuccessStatusCode)
                return NotFound("AI Service not found");

            var responseData = await response.Content.ReadAsStringAsync();
            return Content(responseData, "application/json");
        }

        [HttpPost("extract-metadata")]
        public async Task<IActionResult> ExtractMetadata(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл порожній");

            var client = _httpClientFactory.CreateClient("AiService");

            using var content = new MultipartFormDataContent();
            using var stream = file.OpenReadStream();
            var streamContent = new StreamContent(stream);
            
            content.Add(streamContent, "file", file.FileName);

            var response = await client.PostAsync("convert/extract-metadata", content);
            
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "Помилка комунікації з AI сервісом");

            var responseData = await response.Content.ReadAsStringAsync();
            
            return Content(responseData, "application/json");
        }

        [HttpGet("extract-metadata/status/{taskId}")]
        public async Task<IActionResult> CheckMetadataStatus(string taskId)
        {
            var client = _httpClientFactory.CreateClient("AiService");
            
            var response = await client.GetAsync($"convert/extract-metadata/status/{taskId}");
            
            if (!response.IsSuccessStatusCode)
                return NotFound("Задачу не знайдено");

            var responseData = await response.Content.ReadAsStringAsync();
            return Content(responseData, "application/json");
        }

        [HttpGet("debug-tags")]
        public async Task<IActionResult> DebugAiTags()
        {
            var client = _httpClientFactory.CreateClient("AiService");
            var response = await client.GetAsync("debug/db-tags");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorData = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, errorData);
            }

            var responseData = await response.Content.ReadAsStringAsync();
            return Content(responseData, "application/json");
        }

        [HttpPost("rag/process-book/{bookId}")]
        public async Task<IActionResult> ProcessBookForRag(int bookId)
        {
            var client = _httpClientFactory.CreateClient("AiService");
            var response = await client.PostAsync($"rag/process-book/{bookId}", null);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, errorContent);
            }

            var responseData = await response.Content.ReadAsStringAsync();

            return Content(responseData, "application/json");
        }

        [HttpGet("rag/process-book/status/{taskId}")]
        public async Task<IActionResult> GetProcessBookStatus(string taskId)
        {
            var client = _httpClientFactory.CreateClient("AiService");
            var response = await client.GetAsync($"rag/process-book/status/{taskId}");
            
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return NotFound(new { message = "Task not found" });

                return StatusCode((int)response.StatusCode, "Error fetching status from AI service");
            }

            var responseData = await response.Content.ReadAsStringAsync();
            return Content(responseData, "application/json");
        }

        [HttpPost("rag/parse-pdf/{bookId}")]
        public async Task<IActionResult> ParsePdfToMd(int bookId)
        {
            var client = _httpClientFactory.CreateClient("AiService");
            var response = await client.PostAsync($"rag/convert-to-md/book/{bookId}", null);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, errorContent);
            }

            var responseData = await response.Content.ReadAsStringAsync();
            return Content(responseData, "application/json");
        }

        [HttpGet("rag/parse-pdf/status/{taskId}")]
        public async Task<IActionResult> GetParsePdfStatus(string taskId)
        {
            var client = _httpClientFactory.CreateClient("AiService");
            var response = await client.GetAsync($"rag/convert-to-md/status/{taskId}");
            
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return NotFound(new { message = "Task not found" });

                return StatusCode((int)response.StatusCode, "Error fetching status from AI service");
            }

            var responseData = await response.Content.ReadAsStringAsync();
            return Content(responseData, "application/json");
        }

        [HttpPost("rag/ask")]
        public async Task AskRagQuestion([FromBody] RagAskRequestDto request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                Response.StatusCode = 400;
                await Response.WriteAsync("Query cannot be empty.");
                return;
            }   

            var client = _httpClientFactory.CreateClient("AiService");
            var payload = new
            {
                query = request.Query,
                temperature = request.Temperature,
                enable_thinking = request.EnableThinking,
                use_hybrid_search = request.UseHybridSearch,
                rewrite = request.Rewrite,
                uncensored = request.Uncensored
            };
            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, "rag/ask")
            {
                Content = jsonContent
            };

            using var response = await client.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Response.StatusCode = (int)response.StatusCode;
                await Response.WriteAsync(errorContent);
                return;
            }

            Response.ContentType = "text/event-stream";
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");
            Response.Headers.Append("X-Accel-Buffering", "no");

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length, cancellationToken)) > 0)
            {
                await Response.Body.WriteAsync(buffer, 0, bytesRead, cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }

        [HttpPost("rag/ask/old")]
        public async Task<IActionResult> AskRagQuestionOld([FromBody] RagAskRequestDto request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest("Query cannot be empty.");
            }   

            var client = _httpClientFactory.CreateClient("AiService");
            var payload = new
            {
                query = request.Query,
                temperature = request.Temperature,
                enable_thinking = request.EnableThinking,
                use_hybrid_search = request.UseHybridSearch,
                rewrite = request.Rewrite,
                uncensored = request.Uncensored
            };
            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync("rag/ask/old", jsonContent, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, errorContent);
            }

            var responseData = await response.Content.ReadAsStringAsync();
            return Content(responseData, "application/json");
        }
    }
}