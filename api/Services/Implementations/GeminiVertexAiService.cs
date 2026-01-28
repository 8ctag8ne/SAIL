using System.Text.Json;
using Google.Cloud.AIPlatform.V1;
using api.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.DTOs.Author;
using System.Text.Encodings.Web;
using api.Models.DTOs.Tag;
using api.Models.DTOs.Book;
using api.Models.DTOs;
using MilLib.Mappers;
using api.Helpers;
using System.Text.Json.Serialization;
using MilLib.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using MilLib.Models.DTOs.Book;

namespace MilLib.Services.Implementations
{
    public class GeminiVertexAiService : IBookInfoAnalyzerService, ICheatSheetService
    {
        private readonly PredictionServiceClient _client;
        private readonly string _projectId;
        private readonly string _location;
        private readonly string _model;
        private readonly string _publisher;
        private readonly ApplicationDbContext _context;

        public GeminiVertexAiService(
            PredictionServiceClient client, 
            IConfiguration config, 
            ApplicationDbContext context)
        {
            _client = client;
            _context = context;
            _projectId = config["Gemini:ProjectId"]!;
            _location = config["Gemini:Location"] ?? "us-central1";
            _model = config["Gemini:Model"] ?? "gemini-2.5-pro-preview-0514";
            _publisher = config["Gemini:Publisher"] ?? "google";
        }

        public async Task<string> AnalyzeBookInfoAsync(
            string extractedText, 
            IEnumerable<TagSimpleDto> currentTags, 
            IEnumerable<AuthorSimpleDto> currentAuthors)
        {
            var serializationOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };

            string prompt = $@"
STRICT RULES FOR JSON RESPONSE:
1. Use UTF-8 encoding DIRECTLY, NO Unicode escapes
2. Ukrainian text only for content, technical terms in English when needed

STRICT INSTRUCTIONS FOR BOOK ANALYSIS:

1. CONTEXT ANALYSIS:
- Carefully analyze text from book's content, preface, and chapter titles
- Identify CORE THEMES, not incidental mentions
- For technical books: focus on methodologies, paradigms, practices
- Ignore publisher information and unrelated advertisements

2. TITLE EXTRACTION:
- Extract EXACT book title from context
- Title must match cover page and ISBN data
- Remove edition numbers or publisher prefixes

3. AUTHOR SELECTION RULES:
Existing authors (JSON):
{JsonSerializer.Serialize(currentAuthors, serializationOptions)}
- Select ALL matching authors from provided list
- Priority order for matches:
  1. Exact matches from title page (ordered as listed)
  2. Authors mentioned in introduction
  3. Partial name matches
- If no existing authors match: create new author(s) from title page
- Format: ALWAYS use array under 'authors' key

4. TAG SELECTION CRITERIA:
Existing Tags (prefer EXACT matches):
{JsonSerializer.Serialize(currentTags, new JsonSerializerOptions
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            })}
- Select MAX 5 MOST RELEVANT tags
- Tags MUST represent core concepts:
  Good: 'Рефакторинг', 'Архітектура ПЗ', 'Тестування', 'Java'
  Bad: 'Освіта', 'Підручник', 'Програмування', 'Розробка'
- Never suggest programming languages unless book is SPECIFICALLY about them

5. DESCRIPTION REQUIREMENTS:
- 1200-2000 characters in Ukrainian
- Focus on MAIN CONTENT not preface/examples
- Technical books: emphasize methodologies and practices

EXAMPLE OUTPUTS:
Single author example:
{{
  ""title"": ""Чистий код: Створення, аналіз та рефакторинг"",
  ""authors"": [{{ ""name"": ""Роберт Мартін"" }}],
  ""description"": ""Практичний посібник з написання читабельного та ефективного коду..."",
  ""existingTags"": [{{""id"":45, ""title"":""Розробка ПЗ""}}],
  ""suggestedTags"": [""Читабельність коду"", ""Рефакторинг""]
}}

Multi-author example:
{{
  ""title"": ""Шаблони проєктування: Elements of Reusable Object-Oriented Software"",
  ""authors"": [
    {{ ""id"": 87, ""name"": ""Еріх Гамма"" }},
    {{ ""id"": 88, ""name"": ""Річард Хелм"" }}
  ],
  ""description"": ""Класичний труд з об'єктно-орієнтованого проєктування..."",
  ""existingTags"": [{{""id"":12, ""title"":""ООП""}}],
  ""suggestedTags"": [""Паттерни проєктування""]
}}

YOUR RESPONSE MUST:
- Use 'authors' key with array (even for single author)
- Prioritize authors in order they appear on title page
- Include ALL valid existing authors from provided list
- Create new authors ONLY when no matches exist

BOOK TEXT TO ANALYZE:
===
{extractedText}
===
";

            return await GenerateResponseAsync(prompt);
        }

        public async Task<CheatSheet> GenerateCheatSheet(string userRequest)
        {
            // Перший етап: Отримання ключових слів та початкових результатів
            var initialData = await GetInitialRecommendations(userRequest);

            // Другий етап: Генерація фінального чит-листа
            return await RefineCheatSheet(initialData, userRequest);
        }

        private async Task<string> GenerateResponseAsync(string prompt)
        {
            var request = new GenerateContentRequest
            {
                Model = $"projects/{_projectId}/locations/{_location}/publishers/{_publisher}/models/{_model}",
                Contents =
                {
                    new Content
                    {
                        Role = "user",
                        Parts =
                        {
                            new Part { Text = prompt }
                        }
                    }
                }
            };

            var response = await _client.GenerateContentAsync(request);
            return response.Candidates[0].Content.Parts[0].Text;
        }

        private async Task<CheatSheet> GetInitialRecommendations(string userRequest)
        {
            var serializationOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };

            // ОПТИМІЗАЦІЯ: завантажуємо тільки titles тегів
            var tagTitles = await _context.Tags
                .AsNoTracking()
                .Select(t => t.Title)
                .ToListAsync();

            string prompt = $@"
USER QUERY: {userRequest}

AVAILABLE TAGS ({tagTitles.Count}): 
{JsonSerializer.Serialize(tagTitles, serializationOptions)}

INSTRUCTIONS:
1. Analyze the query and extract 15-20 core technical concepts including English/Ukrainian variants
2. Identify minimum 5-7 categories from available tags using semantic matching
3. Consider synonyms and related concepts
4. Output format:
{{
    ""keywords"": [],
    ""categories"": []
}}

EXAMPLES:
Query: Як покращити безпеку мого .NET API?
Output: {{
    ""keywords"": [""безпека API"", ""OAuth 2.0"", ""JWT tokens"", "".NET Core"", ""HTTPS"", ""CORS""],
    ""categories"": [""Кібербезпека"", ""Веб-розробка"", ""REST API"", ""Аутентифікація"", "".NET""]
}}

STRICT RESPONSE RULES:
1. Output MUST be pure JSON ONLY
2. Never add comments, markdown (```json) or text
3. Ensure proper JSON escaping for Ukrainian characters
4. Validate JSON syntax before responding

BAD EXAMPLE:
```json
{{...}}
```
GOOD EXAMPLE:
{{...}}
";

            var response = await GenerateResponseAsync(prompt);
            response = response.StripJson();
            var analysisResult = JsonSerializer.Deserialize<QueryAnalysisResult>(response, serializationOptions)!;

            // ОПТИМІЗАЦІЯ: пошук по ключових словах напряму в DbContext
            var books = await SearchBooksByKeywords(analysisResult.Keywords, limit: 20);

            // ОПТИМІЗАЦІЯ: завантажуємо тільки відповідні теги
            var selectedTags = await _context.Tags
                .AsNoTracking()
                .Where(tag => analysisResult.Categories.Contains(tag.Title!))
                .Select(t => new TagDto
                {
                    Id = t.Id,
                    Title = t.Title,
                })
                .ToListAsync();

            return new CheatSheet
            {
                Books = books,
                Tags = selectedTags,
                Tips = new List<string>()
            };
        }

        private async Task<CheatSheet> RefineCheatSheet(CheatSheet initialData, string userRequest)
        {
            var serializationOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };

            string prompt = $@"
USER QUERY: {userRequest}

CONTEXT DATA:
- Available books: {JsonSerializer.Serialize(initialData.Books.Select(b => b.Title), serializationOptions)}
- Available tags: {JsonSerializer.Serialize(initialData.Tags.Select(t => t.Title), serializationOptions)}

STRICT INSTRUCTIONS:
1. Generate 3-5 practical tips:
   a) 2-3 tips BASED DIRECTLY on books/tags from context
   b) 1-2 GENERAL best practices from industry experience
   c) All tips must be actionable and technically specific

2. Book selection criteria:
   - 3-5 titles with either:
     * Direct keyword match
     * Conceptual relevance to general tips
   - Prefer newer editions for technical topics

3. Tag selection rules:
   - 3-5 MOST SPECIFIC tags matching either:
     * Technical aspects from query
     * Cross-cutting concerns from general tips

RESPONSE TEMPLATE:
{{
    ""tips"": [
        ""Конкретна порада з використанням книги"",
        ""Загальна рекомендація без прив'язки до ресурсів""
    ],
    ""books"": [""Точна назва 1"", ""Точна назва 2""],
    ""tags"": [""Тег 1"", ""Тег 2""]
}}

STRICT RESPONSE RULES:
1. Output MUST be pure JSON ONLY
2. Never add comments, markdown (```json) or text
3. Ensure proper JSON escaping for Ukrainian characters
4. Validate JSON syntax before responding

BAD EXAMPLE:
```json
{{...}}
```
GOOD EXAMPLE:
{{...}}

EXAMPLES:
Example 1 (Technical):
{{
    ""tips"": [
        ""Застосовуйте принцип Single Responsibility з книги 'Чистий код' для модульного дизайну"",
        ""Використовуйте Typescript для строгої типізації в великих проєктах"",
        ""Регулярно оновлюйте залежності через вразливості безпеки""
    ],
    ""books"": [""Чистий код"", ""TypeScript Essentials""],
    ""tags"": [""SOLID"", ""Типізація"", ""Безпека""]
}}

Example 2 (General):
{{
    ""tips"": [
        ""Впроваджуйте CI/CD пайплайни для автоматизації тестування"",
        ""Використовуйте контейнеризацію для однакових середовищ розробки"",
        ""Проводьте перформанс-тести перед релізом""
    ],
    ""books"": [""Continuous Delivery Handbook"", ""Docker in Action""],
    ""tags"": [""DevOps"", ""Тестування"", ""Оптимізація""]
}}

HARD REQUIREMENTS:
1. Minimum 1 general tip unrelated to books
2. Tips must include BOTH types (specific/general)
3. Never repeat same advice in different tips
4. General tips should reflect industry standards
5. Use exact titles from Context Data
";

            var response = await GenerateResponseAsync(prompt);
            response = response.StripJson();
            var refinementResult = JsonSerializer.Deserialize<CheatSheetRefinement>(
                response, 
                serializationOptions
            ) ?? new CheatSheetRefinement();

            var selectedBooks = initialData.Books
                .Where(b => refinementResult.Books
                    .Any(rb => b.Title.Contains(rb, StringComparison.OrdinalIgnoreCase)))
                .Take(5)
                .ToList();

            var selectedTags = initialData.Tags
                .Where(t => refinementResult.Tags
                    .Any(rt => t.Title.Equals(rt, StringComparison.OrdinalIgnoreCase)))
                .Take(5)
                .ToList();

            // Додати резервний відбір якщо результатів мало
            if (selectedBooks.Count < 3)
            {
                selectedBooks.AddRange(initialData.Books
                    .Except(selectedBooks)
                    .Take(3 - selectedBooks.Count));
            }

            if (selectedTags.Count < 3)
            {
                selectedTags.AddRange(initialData.Tags
                    .Except(selectedTags)
                    .Take(3 - selectedTags.Count));
            }

            return new CheatSheet
            {
                Tips = refinementResult.Tips,
                Books = selectedBooks,
                Tags = selectedTags
            };
        }

        // НОВИЙ МЕТОД: пошук книг по ключових словах
        private async Task<List<BookDto>> SearchBooksByKeywords(List<string> keywords, int limit = 20)
        {
            if (!keywords.Any())
                return new List<BookDto>();

            // ОПТИМІЗАЦІЯ: використовуємо проекцію + фільтрацію в БД
            var books = await _context.Books
                .AsNoTracking()
                .Where(b => keywords.Any(k => 
                    b.Title.Contains(k) || 
                    b.Info!.Contains(k)))
                .Select(b => new
                {
                    b.Id,
                    b.Title,
                    b.ImageUrl,
                    b.Info,
                    b.LikesCount,
                    Tags = b.Tags.Select(bt => new
                    {
                        bt.Tag!.Id,
                        bt.Tag.Title
                    }).ToList(),
                    Authors = b.Authors.Select(ab => new
                    {
                        ab.Author!.Id,
                        ab.Author.Name
                    }).ToList()
                })
                .Take(limit)
                .ToListAsync();

            return books.Select(b => new BookDto
            {
                Id = b.Id,
                Title = b.Title,
                ImageUrl = b.ImageUrl,
                Info = b.Info,
                LikesCount = b.LikesCount,
                Tags = b.Tags.Select(t => new TagSimpleDto
                {
                    Id = t.Id,
                    Title = t.Title
                }).ToList(),
                Authors = b.Authors.Select(a => new AuthorSimpleDto
                {
                    Id = a.Id,
                    Name = a.Name
                }).ToList()
            }).ToList();
        }
    }

    // Допоміжні класи
    class QueryAnalysisResult
    {
        public List<string> Keywords { get; set; } = new List<string>();
        public List<string> Categories { get; set; } = new List<string>();
    }

    class CheatSheetRefinement
    {
        [JsonPropertyName("tips")]
        public List<string> Tips { get; set; } = new List<string>();
        
        [JsonPropertyName("books")]
        public List<string> Books { get; set; } = new List<string>();
        
        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; } = new List<string>();
    }
}