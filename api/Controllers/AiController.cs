using Microsoft.AspNetCore.Mvc;

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
    }
}