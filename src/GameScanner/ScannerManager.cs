using System;
using System.Collections.Generic;
using System.Linq;
using DLSS5Manager.GameScanner.Models;
using GameFinder.RegistryUtils;
using GameFinder.StoreHandlers.Steam;
using GameFinder.StoreHandlers.EGS;
using GameFinder.StoreHandlers.GOG;
using NexusMods.Paths;

namespace DLSS5Manager.GameScanner
{
    public class ScannerManager
    {
        public List<Game> ScanAll()
        {
            var allGames = new List<Game>();
            var fileSystem = FileSystem.Shared;
            var registry = WindowsRegistry.Shared;

            // 1. Steam 游戏扫描
            try
            {
                var steamHandler = new SteamHandler(fileSystem, registry);
                var steamGames = steamHandler.FindAllGames();

                // GameFinder 返回 OneOf<Game, Error>，用 IsT0/AsT0 过滤出成功结果
                var validSteamGames = steamGames.Where(x => x.IsT0).Select(x => x.AsT0);

                foreach (var game in validSteamGames)
                {
                    var appId = game.AppId.Value.ToString();
                    allGames.Add(new Game
                    {
                        Id = appId,
                        Name = game.Name,
                        InstallDirectory = game.Path.GetFullPath(),
                        Launcher = "Steam",
                        CoverImage = $"https://cdn.cloudflare.steamstatic.com/steam/apps/{appId}/header.jpg",
                        Icon = $"https://cdn.cloudflare.steamstatic.com/steam/apps/{appId}/capsule_231x87.jpg"
                    });
                }
            }
            catch (Exception)
            {
                // 扫描失败时跳过该平台，继续扫描其它平台
            }

            // 2. Epic 游戏扫描
            try
            {
                var egsHandler = new EGSHandler(registry, fileSystem);
                var egsGames = egsHandler.FindAllGames();
                var validEgsGames = egsGames.Where(x => x.IsT0).Select(x => x.AsT0);

                foreach (var game in validEgsGames)
                {
                    allGames.Add(new Game
                    {
                        Id = game.CatalogItemId.Value,
                        Name = game.DisplayName,
                        InstallDirectory = game.InstallLocation.GetFullPath(),
                        Launcher = "Epic Games"
                    });
                }
            }
            catch (Exception)
            {
                // 扫描失败时跳过该平台
            }

            // 3. GOG 游戏扫描
            try
            {
                var gogHandler = new GOGHandler(registry, fileSystem);
                var gogGames = gogHandler.FindAllGames();
                var validGogGames = gogGames.Where(x => x.IsT0).Select(x => x.AsT0);

                foreach (var game in validGogGames)
                {
                    allGames.Add(new Game
                    {
                        Id = game.Id.Value.ToString(),
                        Name = game.Name,
                        InstallDirectory = game.Path.GetFullPath(),
                        Launcher = "GOG"
                    });
                }
            }
            catch (Exception)
            {
                // 扫描失败时跳过该平台
            }

            return allGames;
        }
    }
}
