const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const axios = require("axios");

const app = express();
const port = 8080;
const IPTVurl = process.env.IPTV_URL;
const IPTVuser = process.env.IPTV_USER;
const IPTVpass = process.env.IPTV_PASS;

// Função para carregar JSON
const loadJson = (filename) => {
  const filePath = path.join(__dirname, "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

// Middleware de autenticação
app.use(async (req, res, next) => {
  if (req.path.includes("/movie/user/pass") || req.path.includes("/series/user/pass") || req.path.includes("/live/user/pass")) {
    return next();
  }

  const { username, password } = req.query;
  const { user_info } = loadJson("user_info.json");
  console.log(`URL completa: ${req.protocol}://${req.get("host")}${req.originalUrl}`);

  if (
    (username === user_info.username && password === user_info.password) ||
    (!username && !password)
  ) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Endpoint principal – redireciona para o outro site para determinadas ações
app.get("/player_api.php", async (req, res) => {
  const { action, vod_id, series_id } = req.query;

  if (!action) {
    return res.json(loadJson("user_info.json"));
  }

  try {
    switch (action) {
      case "get_vod_info": {
        if (!vod_id) {
          return res.status(400).json({ error: "Parâmetro vod_id é necessário" });
        }
        const vodUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_vod_info&vod_id=${vod_id}`;
        console.log(`Requisitando informações de VOD de: ${vodUrl}`);
        const response = await axios.get(vodUrl);
        return res.json(response.data);
      }
      case "get_series_info": {
        if (!series_id) {
          return res.status(400).json({ error: "Parâmetro series_id é necessário" });
        }
        const seriesUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_series_info&series_id=${series_id}`;
        console.log(`Requisitando informações de série de: ${seriesUrl}`);
        const response = await axios.get(seriesUrl);
        return res.json(response.data);
      }
      default:
        return res.status(400).json({ error: "Ação inválida" });
    }
  } catch (error) {
    console.error("Erro ao processar a requisição:", error.message);
    return res.status(500).json({ error: "Erro ao processar a requisição" });
  }
});

// Streams Adaptados para o Smarters
app.get(["/live/user/pass/:id", "/movie/user/pass/:id", "/series/user/pass/:id"], async (req, res) => {
  const { id } = req.params;
  const streamType = req.path.split('/')[1];
  const streamUrl = `${IPTVurl}/${streamType}/${IPTVuser}/${IPTVpass}/${id}`;

  try {
    const response = await axios({
      method: 'get',
      url: streamUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': req.headers['user-agent'],
        'Range': req.headers['range']
      }
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Content-Length': response.headers['content-length'],
      'Accept-Ranges': 'bytes'
    });

    response.data.pipe(res);
  } catch (error) {
    console.error("Erro no stream:", error.message);
    res.status(500).send("Erro ao buscar o stream");
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor IPTV rodando na porta ${port}`);
});
