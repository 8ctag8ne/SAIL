using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Extensions
{
    public static class ControllerExtensions
    {
        public static async Task<User?> GetCurrentUser(this ControllerBase controller, UserManager<User> userManager)
        {
            if (controller.User.Identity?.IsAuthenticated != true)
            return null;
        
            var username = controller.User.GetUsername();
            var user = await userManager.FindByNameAsync(username);
            return user;
        }
    }
}