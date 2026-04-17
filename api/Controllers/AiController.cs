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
            var response = await client.PostAsync("convert/pdf-to-md", content);
            
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
            var response = await client.GetAsync($"convert/status/{taskId}");
            
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

        [HttpPost("rag/ask")]
        public async Task<IActionResult> AskRagQuestion([FromBody] RagAskRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest("Query cannot be empty.");
            }   

            var client = _httpClientFactory.CreateClient("AiService");
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var jsonContent = new StringContent(JsonSerializer.Serialize(request, jsonOptions), Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync($"rag/ask", jsonContent);

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