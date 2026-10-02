using System.ComponentModel.DataAnnotations;

namespace api.Models.Dtos.Feedback;

public class FeedbackRequestDto
{
    [Required(ErrorMessage = "Вкажіть ваше ім'я")]
    [StringLength(100, ErrorMessage = "Ім'я не повинно перевищувати 100 символів")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Вкажіть ваш email")]
    [EmailAddress(ErrorMessage = "Некоректний формат email")]
    [StringLength(150, ErrorMessage = "Email не повинен перевищувати 150 символів")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Оберіть тему звернення")]
    [StringLength(100, ErrorMessage = "Тема не повинна перевищувати 100 символів")]
    public string Category { get; set; } = string.Empty;

    [Required(ErrorMessage = "Введіть текст повідомлення")]
    [StringLength(3000, MinimumLength = 5, ErrorMessage = "Повідомлення повинно містити від 5 до 3000 символів")]
    public string Message { get; set; } = string.Empty;
}
