using api.Models.Dtos.Feedback;
using api.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace api.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task SendFeedbackEmailAsync(FeedbackRequestDto feedbackDto)
    {
        var recipientEmail = (_configuration["FEEDBACK_RECIPIENT_EMAIL"] ?? "mars.mil.lib@gmail.com").Trim().Trim('"');
        var resendApiKey = (_configuration["RESEND_API_KEY"] ?? _configuration["RESEND_KEY"] ?? "").Trim().Trim('"');
        var fromEmail = (_configuration["RESEND_FROM_EMAIL"] ?? "MARS System <onboarding@resend.dev>").Trim().Trim('"');

        var subject = $"[MARS Зворотний зв'язок] {feedbackDto.Category} - {feedbackDto.Name}";
        var htmlBody = $@"
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
            </div>";

        var textBody = $@"Нове повідомлення зі зворотного зв'язку MARS
----------------------------------------
Відправник: {feedbackDto.Name}
Email: {feedbackDto.Email}
Тема: {feedbackDto.Category}
Час: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC

Повідомлення:
{feedbackDto.Message}";

        // 1. Primary for Cloud: Resend HTTPS API (bypasses Railway SMTP port blocking)
        if (!string.IsNullOrWhiteSpace(resendApiKey))
        {
            try
            {
                _logger.LogInformation("Sending feedback email via Resend HTTPS API to {Recipient}...", recipientEmail);
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(10);
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", resendApiKey);

                var payload = new
                {
                    from = fromEmail,
                    to = new[] { recipientEmail },
                    reply_to = feedbackDto.Email,
                    subject = subject,
                    html = htmlBody,
                    text = textBody
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync("https://api.resend.com/emails", jsonContent);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Feedback email successfully sent via Resend HTTPS API for {Email}", feedbackDto.Email);
                    return;
                }

                var errBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Resend API returned {StatusCode}: {Error}. Falling back to SMTP...", response.StatusCode, errBody);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Resend API call failed. Falling back to SMTP...");
            }
        }

        // 2. Secondary / Local: Direct SMTP (e.g. for local development)
        var smtpHost = (_configuration["SMTP_HOST"] ?? "smtp.gmail.com").Trim().Trim('"');
        var smtpPortStr = (_configuration["SMTP_PORT"] ?? "587").Trim().Trim('"');
        var smtpUser = (_configuration["SMTP_USER"] ?? "mars.mil.lib@gmail.com").Trim().Trim('"');
        var smtpPass = (_configuration["SMTP_PASS"] ?? _configuration["GMAIL_APP_PASSWORD"] ?? "")
            .Trim()
            .Trim('"')
            .Replace(" ", "");

        int.TryParse(smtpPortStr, out var smtpPort);
        if (smtpPort <= 0) smtpPort = 587;

        if (string.IsNullOrWhiteSpace(smtpPass))
        {
            _logger.LogWarning("Neither RESEND_API_KEY nor SMTP_PASS is configured. Feedback from {Email} logged locally:\nName: {Name}\nCategory: {Category}\nMessage: {Message}",
                feedbackDto.Email, feedbackDto.Name, feedbackDto.Category, feedbackDto.Message);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("MARS System", smtpUser));
        message.To.Add(new MailboxAddress("MARS Admin", recipientEmail));
        message.ReplyTo.Add(new MailboxAddress(feedbackDto.Name, feedbackDto.Email));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = textBody
        };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        client.Timeout = 10000;
        client.CheckCertificateRevocation = false;
        client.AuthenticationMechanisms.Remove("XOAUTH2");

        var portsToTry = new List<(int port, SecureSocketOptions socketOption)>
        {
            (
                smtpPort,
                smtpPort == 465 
                    ? SecureSocketOptions.SslOnConnect 
                    : (smtpPort == 587 ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto)
            )
        };

        if (smtpPort == 587)
        {
            portsToTry.Add((465, SecureSocketOptions.SslOnConnect));
        }
        else if (smtpPort == 465)
        {
            portsToTry.Add((587, SecureSocketOptions.StartTls));
        }

        Exception? lastException = null;
        bool emailSent = false;

        foreach (var (port, socketOption) in portsToTry)
        {
            try
            {
                _logger.LogInformation("Connecting to SMTP {Host}:{Port} ({Option}) as {User}...", smtpHost, port, socketOption, smtpUser);

                if (!client.IsConnected)
                {
                    await client.ConnectAsync(smtpHost, port, socketOption);
                }

                if (!client.IsAuthenticated)
                {
                    await client.AuthenticateAsync(smtpUser, smtpPass);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                _logger.LogInformation("Feedback email successfully sent via SMTP {Host}:{Port} from {SenderEmail}", smtpHost, port, feedbackDto.Email);
                emailSent = true;
                break;
            }
            catch (Exception ex)
            {
                lastException = ex;
                _logger.LogWarning(ex, "Failed attempt to connect/send via SMTP {Host}:{Port}. Trying next option if available...", smtpHost, port);

                if (client.IsConnected)
                {
                    try { await client.DisconnectAsync(true); } catch { }
                }
            }
        }

        if (!emailSent)
        {
            _logger.LogError(lastException, "Failed to send feedback email after trying all available ports. Host={Host}, User={User}", smtpHost, smtpUser);
            throw new InvalidOperationException("Не вдалося надіслати повідомлення. Спробуйте пізніше або зверніться напряму.", lastException);
        }
    }
}
