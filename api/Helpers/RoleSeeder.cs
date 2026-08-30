using api.Models.DTOs.Account;
using api.Models.Entities;
using api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;


public static class RoleHelper
{
    public static async Task SeedRolesAndAdmin(IServiceProvider serviceProvider, ITokenService tokenService)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        
        // Визначення системних ролей із фіксованими ідентифікаторами для нової інфраструктури
        var roleDefinitions = new (string Name, string Id)[]
        {
            ("Admin", "28ce31cc-ab42-49c6-98d6-d74ddfb3b012"),
            ("Librarian", "a96399e8-3c1f-4626-9da2-bf3550a09c34"),
            ("User", "ea9624f7-b305-40a5-885e-d93786cc4620")
        };

        foreach (var (roleName, roleId) in roleDefinitions)
        {
            // Якщо роль уже існує в БД — не чіпаємо її; якщо немає — створюємо
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole
                {
                    Id = roleId,
                    Name = roleName,
                    NormalizedName = roleName.ToUpperInvariant()
                });
            }
        }

        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        // Пошук дефолтного адміністратора
        var adminEmail = "admin@example.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail) 
                     ?? await userManager.FindByNameAsync("admin");

        if (adminUser == null)
        {
            // Створення адміністратора з нуля при розгортанні на новій БД
            var user = new User
            {
                UserName = "admin",
                Email = adminEmail
            };

            var result = await userManager.CreateAsync(user, "Admin123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, "User");
                await userManager.AddToRoleAsync(user, "Admin");
            }
        }
        else
        {
            // Якщо користувач вже існує в БД — додаємо тільки ті ролі, яких бракує (нічого не видаляючи)
            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
            if (!await userManager.IsInRoleAsync(adminUser, "User"))
            {
                await userManager.AddToRoleAsync(adminUser, "User");
            }
        }
    }
}
