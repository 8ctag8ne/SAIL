using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MilLib.Models.Entities
{
    [Table("ai_tasks")]
    public class AITask
    {
        [Key]
        [Column("id")]
        [StringLength(64)]
        public string Id { get; set; } = string.Empty;

        [Required]
        [Column("task_type")]
        [StringLength(50)]
        public string TaskType { get; set; } = string.Empty;

        [Required]
        [Column("status")]
        [StringLength(20)]
        public string Status { get; set; } = "processing";

        [Column("book_id")]
        public int? BookId { get; set; }

        [Column("result", TypeName = "jsonb")]
        public string? Result { get; set; }

        [Column("error")]
        public string? Error { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
