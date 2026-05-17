//api/Models/Entities/DocumentChunk.cs
using System.ComponentModel.DataAnnotations.Schema;
using Pgvector;

namespace MilLib.Models.Entities
{
    public class DocumentChunk
    {
        public Guid Id { get; set; }
        public int BookId { get; set; }
        
        // Hierarchy
        public int Level { get; set; } // 0 - Whole document, 1 - Section, 2 - Subsection, 3 - Paragraph
        public Guid? ParentId { get; set; } 
        public DocumentChunk? Parent { get; set; } 
        public List<DocumentChunk> Children { get; set; } = new List<DocumentChunk>();

        public Book? Book {get; set;}
        
        // Metadata
        public int? PageStart { get; set; }
        public int? PageEnd { get; set; }
        public string Text { get; set; } = string.Empty;
        
        [Column(TypeName = "vector(2560)")] 
        public Vector? Embedding { get; set; }
    }
}