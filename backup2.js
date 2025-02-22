const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const { title } = require("process");

const app = express();
const port = 8080;
const IPTVurl = "http://vantrulent.com:80";
const IPTVuser = "859951917";
const IPTVpass = "U218v1412D";

// carregar JSON
const loadJson = (filename) => {
    const filePath = path.join(__dirname, "data", filename);
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

// carregar Infos
const loadInfo = async (type, id) => {
    console.log('Tipo:', type);
    console.log('ID:', id);
    const serverUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_${type}_info&${type}_id=${id}`;
    console.log('URL:', serverUrl);
    console.log('Acessando servidor...');
    try {
        const response = await axios.get(serverUrl);
        return response.data;
    } catch (error) {
        console.error("Erro ao acessar o servidor (infos):", error.message);
        return { error: "Erro ao acessar as informações do servidor." };
    }
};

// carregar Categories
const loadCategories = async (type) => {
    const serverUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_${type}_categories`;
    try {
        const response = await axios.get(serverUrl);
        return response.data;
    } catch (error) {
        console.error("Erro ao acessar o servidor (categories):", error.message);
        return { error: "Erro ao acessar as informações do servidor." };
    }
};

const loadStreams = async (type) => {
    let serverUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_${type}_streams`;

    if (type === "series") {
        serverUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_${type}`;
    }

    try {
        const response = await axios.get(serverUrl);
        return response.data;
    } catch (error) {
        console.error("Erro ao acessar o servidor (stream):", error.message);
        return { error: "Erro ao acessar as informações do servidor." };
    }
};

// autenticação simples
app.use((req, res, next) => {
    const { username, password } = req.query;
    const { user_info } = loadJson("user_info.json");
    console.log(`URL completa: ${req.protocol}://${req.get("host")}${req.originalUrl}`);
    console.log(`Parâmetros recebidos:`, { username, password });

    if (username === user_info.username && password === user_info.password || username === undefined && password === undefined) {
        next();
    } else {
        console.log("Acesso não autorizado");
        res.status(401).json({ error: "Unauthorized" });
    }
});

// Endpoint principal
app.get("/player_api.php", async (req, res) => {
    const { action, vod_id, series_id, stream_id } = req.query;
    console.log('Parâmetros recebidos:', { action, vod_id, series_id, stream_id });

    // Retorna informações de usuário e servidor
    if (!action) {
        const data = loadJson("user_info.json");
        return res.json(data);
    }

    switch (action) {
        case "get_live_categories":
            {
                const data = await loadCategories("live");
                return res.json(data);
            }
        case "get_live_streams":
            {
                // const { live } = loadJson("streams.json");
                // return res.json(live);
                const data = await loadStreams("live");
                return res.json(data);
            }
        case "get_vod_categories":
            {
                const data = await loadCategories("vod");
                return res.json(data);
            }
        case "get_vod_streams":
            {
                // const { vod } = loadJson("streams.json");
                // return res.json(vod);
                const data = await loadStreams("vod");
                return res.json(data);
            }
        case "get_vod_info":
            {
                const data = await loadInfo("vod", vod_id);
                return res.json(data);
            }
        case "get_series_categories":
            {
                const data = await loadCategories("series");
                return res.json(data);
            }
        case "get_series":
            {
                // const { series } = loadJson("streams.json");
                // return res.json(series);
                const data = await loadStreams("series");
                return res.json(data);
            }
        case "get_series_info":
            {
                console.log('ID da série:', series_id);
                const data = await loadInfo("series", series_id);
                return res.json(data);
            }
        default:
            res.status(400).json({ error: "Ação inválida" });
            break;
    }
});

app.get("/movie/user/pass/:id", async (req, res) => {
    const { id } = req.params;
    let streamUrl = `${IPTVurl}/movie/${IPTVuser}/${IPTVpass}/${id}`;
    res.redirect(streamUrl);
});

app.get("/series/user/pass/:id", async (req, res) => {
    const { id } = req.params;
    let streamUrl = `${IPTVurl}/series/${IPTVuser}/${IPTVpass}/${id}`;
    res.redirect(streamUrl);
});

app.get("/live/user/pass/:id", async (req, res) => {
    let { id } = req.params;
    id = id.replace('.m3u8', '');
    let streamUrl = `${IPTVurl}/${IPTVuser}/${IPTVpass}/${id}`;
    res.redirect(streamUrl);
});

app.get("/user/pass/:id", async (req, res) => {
    let { id } = req.params;
    id = id.replace('.m3u8', '');
    let streamUrl = `${IPTVurl}/${IPTVuser}/${IPTVpass}/${id}`;
    res.redirect(streamUrl);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor IPTV rodando na porta ${port}`);
});
