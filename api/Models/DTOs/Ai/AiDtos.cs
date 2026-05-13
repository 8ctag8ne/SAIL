namespace MilLib.Models.DTOs.Ai
{
    public class ProcessBookTaskResponseDto
    {
        public string TaskId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Error { get; set; }
    }

    public class RagAskRequestDto
    {
        public required string Query { get; set; }
        public double? Temperature { get; set; }
        public bool? EnableThinking { get; set; }
        public bool UseHybridSearch { get; set; } = true;
    }

    public class RagAskResponseDto
    {
        public string Answer { get; set; } = string.Empty;
        public List<DocumentChunkResponseDto> Sources { get; set; } = new();
        public List<string> SuggestedQuestions { get; set; } = new List<string>();
    }

    public class DocumentChunkResponseDto
    {
        public Guid Id { get; set; }
        public int BookId { get; set; }
        public int Level { get; set; }
        public int PageStart { get; set; }
        public int PageEnd { get; set; }
        public string Text { get; set; } = string.Empty;
        public double SimilarityScore { get; set; }
    }
}