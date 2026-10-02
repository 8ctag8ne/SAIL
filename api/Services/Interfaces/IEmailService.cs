using api.Models.Dtos.Feedback;

namespace api.Services.Interfaces;

public interface IEmailService
{
    Task SendFeedbackEmailAsync(FeedbackRequestDto feedbackDto);
}
