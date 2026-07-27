using System.Linq;
using System.Text.Json.Serialization;
using api.Helpers;
using api.Models.Entities;
using api.Services.Implementations;
using api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
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
    if(builder.Environment.IsProduction())
    {
        options.UseNpgsql(
            builder.Configuration["SUPABASE_SESSION_POOLER"], 
            o => o.UseVector())  //prod (cloud)
            .UseSnakeCaseNamingConvention();
    } else
    {
        options.UseNpgsql(
            builder.Configuration["DB_CONNECTION_LOCAL"],
            o => o.UseVector())  //dev (local)
            .UseSnakeCaseNamingConvention(); 
    }
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
        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["JWT:SigningKey"]!)
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
        var allowedOriginsConfig = builder.Configuration["AllowedOrigins"];
        var allowedOrigins = !string.IsNullOrEmpty(allowedOriginsConfig)
            ? allowedOriginsConfig.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                  .Select(o => o.Trim().TrimEnd('/'))
                                  .ToArray()
            : new[] { "http://localhost:3000" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

if(builder.Environment.IsProduction())
{
    builder.Services.AddScoped<IFileService, CloudFileService>(); //prod (cloud)
} 
else
{    
    builder.Services.AddScoped<IFileService, LocalFileService>(); //dev (local)
}

builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<IAuthorService, AuthorService>();
builder.Services.AddScoped<IBookListService, BookListService>();
builder.Services.AddScoped<ICommentService, CommentService>();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPdfRenderService, PdfService>();

var aiServiceUrl = builder.Configuration["AI_SERVICE_URL"] ?? "http://localhost:8000";

builder.Services.AddHttpClient("AiService", c => c.BaseAddress = new Uri(aiServiceUrl));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // 1. Health Check Rate Limiter (5 requests per minute)
    options.AddFixedWindowLimiter("HealthCheckLimiter", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });

    // 2. Authentication Rate Limiter (5 requests per minute per IP address for Login/Register)
    options.AddPolicy("AuthRateLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() 
                ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }
        )
    );

    // 3. AI & Heavy Operations Rate Limiter (10 requests per minute per IP address)
    options.AddPolicy("AiRateLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() 
                ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }
        )
    );
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseStaticFiles();
app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

try
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var tokenService = services.GetRequiredService<ITokenService>();
        await RoleHelper.SeedRolesAndAdmin(services, tokenService);
    }
}
catch(Exception ex)
{
    Console.WriteLine($"Issues with JWT or role seeding: {ex.Message}");
}

app.UseRateLimiter();
app.MapControllers();


app.Run();