# Етап 1: Збирання (Build)
# Використовуємо образ із встановленим .NET SDK (він важкий, але вміє білдити код)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копіюємо файл проєкту і відновлюємо залежності (NuGet пакети)
# Це робиться окремо для кешування — якщо ти не міняв пакети, Docker пропустить цей крок
COPY ["api.csproj", "./"]
RUN dotnet restore

# Копіюємо весь інший код і збираємо релізну версію
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Етап 2: Запуск (Runtime)
# Беремо легкий образ, де є тільки середовище виконання (без зайвих інструментів)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Забираємо тільки готові бінарні файли з першого етапу
COPY --from=build /app/publish .

# Вказуємо порт (Railway любить 8080)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Команда запуску
ENTRYPOINT ["dotnet", "api.dll"]