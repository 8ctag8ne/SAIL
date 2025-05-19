using System.Text.Json;
using Google.Cloud.AIPlatform.V1;
using api.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.DTOs.Author;
using System.Text.Encodings.Web;

namespace MilLib.Services.Implementations
{
    public class GeminiVertexAiService : IBookInfoAnalyzerService
    {
        private readonly PredictionServiceClient _client;
        private readonly string _projectId;
        private readonly string _location;
        private readonly string _model;
        private readonly string _publisher;

        public GeminiVertexAiService(PredictionServiceClient client, IConfiguration config)
        {
            _client = client;
            _projectId = config["Gemini:ProjectId"]!;
            _location = config["Gemini:Location"] ?? "us-central1";
            _model = config["Gemini:Model"] ?? "gemini-2.5-pro-preview-0514";
            _publisher = config["Gemini:Publisher"] ?? "google";
        }

        public async Task<string> AnalyzeBookInfoAsync(string extractedText, IEnumerable<TagSimpleDto> currentTags, IEnumerable<AuthorSimpleDto> currentAuthors)
        {
            var endpoint = $"projects/{_projectId}/locations/{_location}/publishers/{_publisher}/models/{_model}";

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
- Select ONLY ONE author even if multiple exist
- Priority order:
  1. First exact match from title page
  2. First mentioned in introduction
  3. First existing author with partial name match
  4. New author from title page
- If multiple existing authors match: select FIRST in provided list
- Format: SINGLE author object under 'author' key

4. TAG SELECTION CRITERIA:
Existing Tags (prefer EXACT matches):
{JsonSerializer.Serialize(currentTags, new JsonSerializerOptions 
{ 
    Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
})}
- Select MAX 5 MOST RELEVANT tags
- Tags MUST represent core concepts:
  Good: 'Рефакторинг', 'Архітектура ПЗ', 'Тестування'
  Bad: 'C++', 'Освіта', 'Підручник', 'Програмування'
- Never suggest programming languages unless book is SPECIFICALLY about them

5. DESCRIPTION REQUIREMENTS:
- 1200-2000 characters in Ukrainian
- Focus on MAIN CONTENT not preface/examples
- Technical books: emphasize methodologies and practices

EXAMPLE OUTPUT FOR MULTI-AUTHOR BOOK:
{{
  ""title"": ""Шаблони проєктування: Elements of Reusable Object-Oriented Software"",
  ""author"": {{ ""id"": 87, ""name"": ""Еріх Гамма"" }},
  ""description"": ""Класичний труд з об'єктно-орієнтованого проєктування... Приклади на C++ та Smalltalk."",
  ""existingTags"": [{{""id"":12, ""title"":""Об'єктно-орієнтоване програмування""}}],
  ""suggestedTags"": [""Паттерни проєктування"", ""SOLID принципи""]
}}

YOUR RESPONSE MUST BE:
- Pure JSON without formatting
- Ukrainian text content
- Only ONE author even if multiple co-authors exist
- Strictly follow priority rules for author selection

BOOK TEXT TO ANALYZE:
===
{extractedText}
===
";

            var request = new GenerateContentRequest
            {
                Model = endpoint,
                Contents = {
                    new Content
                    {
                        Role = "user",
                        Parts = { new Part { Text = prompt } }
                    }
                }
            };

            var response = await _client.GenerateContentAsync(request);
            return response.Candidates[0].Content.Parts[0].Text;
        }
    }
}