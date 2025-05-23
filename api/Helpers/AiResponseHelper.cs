using System;
using System.CodeDom;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Helpers
{
    public static class AiResponseHelper
    {
        public static string StripJson(this string input)
        {
            input = input.Replace("`", "");
            if (input.StartsWith("json"))
            {
                input = input.Substring(4);
            }
            return input;
        }
    }
}