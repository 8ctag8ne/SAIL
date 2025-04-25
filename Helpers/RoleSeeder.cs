using api.Models.DTOs.Account;
using api.Models.Entities;
using api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;


public static class RoleHelper
{
    public static async Task SeedRolesAndAdmin(IServiceProvider serviceProvider, ITokenService tokenService)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        string[] roles = { "Admin", "User", "Librarian" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        // Add default admin user if none exists
        var adminEmail = "admin@example.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            var user = new User
            {
                UserName = "admin",
                Email = adminEmail
            };
                    

            var result = await userManager.CreateAsync(user, "Admin123!");
            if (result.Succeeded)
            {
                var roleResult = await userManager.AddToRoleAsync(user, "User");
                await userManager.AddToRoleAsync(user, "Admin");
                if(roleResult.Succeeded)
                {
                    new NewUserDto
                        {
                            UserName = user.UserName,
                            Email = user.Email,
                            Token = await tokenService.CreateTokenAsync(user),
                        };
                }
            }
        }
    }
}
