using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace api.Models.Entities
{
    public class User : IdentityUser
    {
        public string? About { get; set; }
    }
}