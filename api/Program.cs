using System.Text.Json.Serialization;
using api.Helpers;
using api.Models.Entities;
using api.Services.Implementations;
using api.Services.Interfaces;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.AIPlatform.V1;
using Grpc.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MilLib.Services.Implementations;
using MilLib.Services.Interfaces;
using dotenv.net;

var builder = WebApplication.CreateBuilder(args);
DotEnv.Load();
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers(options =>
    {
        options.Filters.Add<ExecutionTimeFilter>();
    })
    .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        });

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
        // options.UseSqlServer(Environment.GetEnvironmentVariable("DB_CONNECTION_LOCAL")); //dev(local)
        options.UseNpgsql(builder.Configuration["DB_CONNECTION_SUPABASE"])  //prod (cloud)
            .UseSnakeCaseNamingConvention();
    });


builder.Services.AddIdentity<User, IdentityRole>(options => {
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 8;
})
.AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = 
    options.DefaultChallengeScheme =
    options.DefaultForbidScheme = 
    options.DefaultScheme = 
    options.DefaultSignInScheme = 
    options.DefaultSignOutScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = Environment.GetEnvironmentVariable("JWT__Issuer"),
        ValidateAudience = true,
        ValidAudience = Environment.GetEnvironmentVariable("JWT__Audience"),
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT__SigningKey"))
        )
    };
});


// builder.Services.AddAutoMapper(typeof(Program));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "Demo API", Version = "v1" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type=ReferenceType.SecurityScheme,
                    Id="Bearer"
                }
            },
            new string[]{}
        }
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000") // твій фронтенд
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// builder.Services.AddScoped<IFileService, LocalFileService>(); //dev (local)
builder.Services.AddScoped<IFileService, CloudFileService>(); //prod (cloud)

builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<IAuthorService, AuthorService>();
builder.Services.AddScoped<IBookListService, BookListService>();
builder.Services.AddScoped<ICommentService, CommentService>();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPdfRenderService, PdfService>();
builder.Services.AddScoped<IPdfTextExtractorService, PdfService>();
builder.Services.AddScoped<IOcrService, OcrService>();
// Реєстрація PredictionServiceClient через JSON-ключ
builder.Services.AddScoped<PredictionServiceClient>(provider =>
{
    var location = Environment.GetEnvironmentVariable("Gemini__Location") ?? "us-central1";
    var jsonPath = Environment.GetEnvironmentVariable("Gemini__JsonKeyPath")!;

    var credential = GoogleCredential
        .FromFile(jsonPath)
        .CreateScoped("https://www.googleapis.com/auth/cloud-platform");

    return new PredictionServiceClientBuilder
    {
        Endpoint = $"{location}-aiplatform.googleapis.com",
        ChannelCredentials = credential.ToChannelCredentials()
    }.Build();
});

// Реєстрація сервісу з інтерфейсом
builder.Services.AddScoped<IBookInfoAnalyzerService, GeminiVertexAiService>();
builder.Services.AddScoped<ICheatSheetService, GeminiVertexAiService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();


using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var tokenService = services.GetRequiredService<ITokenService>();
    await RoleHelper.SeedRolesAndAdmin(services, tokenService);
}

app.MapControllers();

app.Run();
