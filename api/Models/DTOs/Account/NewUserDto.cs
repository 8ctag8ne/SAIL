using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models.DTOs.Account
{
    public class NewUserDto
    {
        public string UserName { get; set; }
        public string Id { get; set; }
        public string Email { get; set; }
        public string Token { get; set; }
        public List<string> Roles {get; set;} = new List<string>();
    }
}