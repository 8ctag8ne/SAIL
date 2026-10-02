using api.Models.Dtos.Feedback;
using api.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace api.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendFeedbackEmailAsync(FeedbackRequestDto feedbackDto)
    {
        var smtpHost = (_configuration["SMTP_HOST"] ?? "smtp.gmail.com").Trim().Trim('"');
        var smtpPortStr = (_configuration["SMTP_PORT"] ?? "587").Trim().Trim('"');
        var smtpUser = (_configuration["SMTP_USER"] ?? "mars.mil.lib@gmail.com").Trim().Trim('"');
        var smtpPass = (_configuration["SMTP_PASS"] ?? _configuration["GMAIL_APP_PASSWORD"] ?? "")
            .Trim()
            .Trim('"')
            .Replace(" ", "");
        var recipientEmail = (_configuration["FEEDBACK_RECIPIENT_EMAIL"] ?? "mars.mil.lib@gmail.com").Trim().Trim('"');

        int.TryParse(smtpPortStr, out var smtpPort);
        if (smtpPort <= 0) smtpPort = 587;

        if (string.IsNullOrWhiteSpace(smtpPass))
        {
            _logger.LogWarning("SMTP_PASS / GMAIL_APP_PASSWORD is not configured. Feedback from {Email} logged locally:\nName: {Name}\nCategory: {Category}\nMessage: {Message}",
                feedbackDto.Email, feedbackDto.Name, feedbackDto.Category, feedbackDto.Message);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("MARS System", smtpUser));
        message.To.Add(new MailboxAddress("MARS Admin", recipientEmail));
        message.ReplyTo.Add(new MailboxAddress(feedbackDto.Name, feedbackDto.Email));

        message.Subject = $"[MARS Зворотний зв'язок] {feedbackDto.Category} - {feedbackDto.Name}";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #2d2f33; padding: 20px; background-color: #f9f9f9;"">
                    <h2 style=""color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 8px;"">Нове повідомлення зі зворотного зв'язку MARS</h2>
                    <table style=""width: 100%; margin-top: 15px; border-collapse: collapse;"">
                        <tr>
                            <td style=""padding: 6px 0; font-weight: bold; width: 140px;"">Відправник:</td>
                            <td style=""padding: 6px 0;"">{feedbackDto.Name}</td>
                        </tr>
                        <tr>
                            <td style=""padding: 6px 0; font-weight: bold;"">Email для відповіді:</td>
                            <td style=""padding: 6px 0;""><a href=""mailto:{feedbackDto.Email}"">{feedbackDto.Email}</a></td>
                        </tr>
                        <tr>
                            <td style=""padding: 6px 0; font-weight: bold;"">Тема звернення:</td>
                            <td style=""padding: 6px 0;"">{feedbackDto.Category}</td>
                        </tr>
                        <tr>
                            <td style=""padding: 6px 0; font-weight: bold;"">Час (UTC):</td>
                            <td style=""padding: 6px 0;"">{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}</td>
                        </tr>
                    </table>
                    <div style=""margin-top: 20px; padding: 15px; background-color: #ffffff; border-left: 4px solid #2e7d32; border-radius: 4px;"">
                        <h4 style=""margin-top: 0; color: #333;"">Повідомлення:</h4>
                        <p style=""white-space: pre-wrap; line-height: 1.5; color: #111;"">{System.Net.WebUtility.HtmlEncode(feedbackDto.Message)}</p>
                    </div>
                </div>",
            TextBody = $@"Нове повідомлення зі зворотного зв'язку MARS
----------------------------------------
Відправник: {feedbackDto.Name}
Email: {feedbackDto.Email}
Тема: {feedbackDto.Category}
Час: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC

Повідомлення:
{feedbackDto.Message}"
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            client.CheckCertificateRevocation = false;
            // Remove XOAUTH2 to force password-based SASL (PLAIN/LOGIN) for Gmail App Passwords
            client.AuthenticationMechanisms.Remove("XOAUTH2");

            _logger.LogInformation("Connecting to SMTP {Host}:{Port} as {User}...", smtpHost, smtpPort, smtpUser);

            var secureSocketOption = smtpPort == 465 
                ? SecureSocketOptions.SslOnConnect 
                : (smtpPort == 587 ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);

            await client.ConnectAsync(smtpHost, smtpPort, secureSocketOption);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Feedback email successfully sent from {SenderEmail} for {Name}", feedbackDto.Email, feedbackDto.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send feedback email from {Email}. Host={Host}, Port={Port}, User={User}", feedbackDto.Email, smtpHost, smtpPort, smtpUser);
            throw new InvalidOperationException("Не вдалося надіслати повідомлення. Спробуйте пізніше або зверніться напряму.", ex);
        }
    }
}
