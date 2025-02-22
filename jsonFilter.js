const fs = require('fs');
const path = require('path');
require('dotenv').config();

const IPTVurl = process.env.IPTV_URL;
const IPTVuser = process.env.IPTV_USER;
const IPTVpass = process.env.IPTV_PASS;

// Lista de IDs de categorias de conteúdo adulto que queremos filtrar
const adultCategoryIds = ["36", "610", "881", "898", "897", "896", "895"]; // Exemplo de IDs de categorias de conteúdo adulto

// Função para filtrar os conteúdos adultos
function filterAdultContent(data) {
    console.log(data);
    if (!Array.isArray(data)) {
        throw new Error("O formato dos dados recebidos não é um array.");
    }
    return data.filter(item => !adultCategoryIds.includes(String(item.category_id)));
}

// Função para filtrar categorias de conteúdo adulto
function filterAdultCategories(categories) {
    return categories.filter(category => !adultCategoryIds.includes(String(category.category_id)));
}

// Função para baixar os 3 JSONs, filtrar e salvar no sistema de arquivos
async function downloadAndFilterJSONs() {
    try {
        // Acessa os endpoints dos streams e categorias
        const liveUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_live_streams`;
        const vodUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_vod_streams`;
        const seriesUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_series`;

        const liveCategoriesUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_live_categories`;
        const vodCategoriesUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_vod_categories`;
        const seriesCategoriesUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_series_categories`;

        // Fazendo as requisições
        const [liveResponse, vodResponse, seriesResponse, liveCategoriesResponse, vodCategoriesResponse, seriesCategoriesResponse] = await Promise.all([
            fetch(liveUrl),
            fetch(vodUrl),
            fetch(seriesUrl),
            fetch(liveCategoriesUrl),
            fetch(vodCategoriesUrl),
            fetch(seriesCategoriesUrl)
        ]);

        console.log(liveResponse);

        // Verifica se as respostas são bem-sucedidas
        if (liveResponse.ok && vodResponse.ok && seriesResponse.ok && liveCategoriesResponse.ok && vodCategoriesResponse.ok && seriesCategoriesResponse.ok) {
            const liveData = await liveResponse.json();
            const vodData = await vodResponse.json();
            const seriesData = await seriesResponse.json();
            const liveCategories = await liveCategoriesResponse.json();
            const vodCategories = await vodCategoriesResponse.json();
            const seriesCategories = await seriesCategoriesResponse.json();

            // Filtrando os dados para remover conteúdo adulto
            console.log(liveData);
            const filteredLiveData = filterAdultContent(liveData);
            const filteredVODData = filterAdultContent(vodData);
            const filteredSeriesData = filterAdultContent(seriesData);

            // Filtrando as categorias para remover conteúdo adulto
            const filteredLiveCategories = filterAdultCategories(liveCategories);
            const filteredVODCategories = filterAdultCategories(vodCategories);
            const filteredSeriesCategories = filterAdultCategories(seriesCategories);

            // Garantir que a pasta "data" exista, caso contrário, criar
            const dataFolder = path.join(__dirname, 'data');
            if (!fs.existsSync(dataFolder)) {
                fs.mkdirSync(dataFolder);
            }

            // Salvando os arquivos JSON filtrados na pasta "data"
            fs.writeFileSync(path.join(dataFolder, 'filtered_live_streams.json'), JSON.stringify(filteredLiveData, null, 2));
            fs.writeFileSync(path.join(dataFolder, 'filtered_vod_streams.json'), JSON.stringify(filteredVODData, null, 2));
            fs.writeFileSync(path.join(dataFolder, 'filtered_series_streams.json'), JSON.stringify(filteredSeriesData, null, 2));
            fs.writeFileSync(path.join(dataFolder, 'filtered_live_categories.json'), JSON.stringify(filteredLiveCategories, null, 2));
            fs.writeFileSync(path.join(dataFolder, 'filtered_vod_categories.json'), JSON.stringify(filteredVODCategories, null, 2));
            fs.writeFileSync(path.join(dataFolder, 'filtered_series_categories.json'), JSON.stringify(filteredSeriesCategories, null, 2));

            console.log("Arquivos JSON filtrados e salvos na pasta 'data' com sucesso!");
        } else {
            console.error("Erro ao acessar as APIs:", liveResponse.status, vodResponse.status, seriesResponse.status);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

// Chama a função para baixar, filtrar e salvar os JSONs
downloadAndFilterJSONs();
