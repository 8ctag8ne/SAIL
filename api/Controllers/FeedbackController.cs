using api.Models.Dtos.Feedback;
using api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("FeedbackRateLimiter")]
public class FeedbackController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<FeedbackController> _logger;

    public FeedbackController(IEmailService emailService, ILogger<FeedbackController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _emailService.SendFeedbackEmailAsync(dto);
            return Ok(new { message = "Ваше повідомлення успішно надіслано." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while processing feedback submission");
            return StatusCode(500, new { message = "Не вдалося надіслати повідомлення. Спробуйте пізніше." });
        }
    }
}
