"use server";

import { getMappings } from "./mapping";

export const getEpisodes = async (id, title) => {
  if (!id || !title) return [];

  try {
    const mappingID = await getMappings(title);
    if (!mappingID) return [];

    // Fetch from your own AnimeKai proxy API
    const animeKaiEpisodes = await fetchAnimeKaiEpisodes(mappingID);
    let episodes = animeKaiEpisodes || [];

    const coverMeta = await fetchEpisodeMeta(id);
    if (coverMeta.length > 0) {
      episodes = CombineEpisodeMeta(episodes, coverMeta);
    }

    return episodes;
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }
};

async function fetchAnimeKaiEpisodes(mappingId) {
  try {
    const res = await fetch(`https://no-drab.vercel.app/anime/animekai/info?id=${mappingId}`);
    if (!res.ok) throw new Error(`Failed to fetch AnimeKai episodes: ${res.status}`);

    const data = await res.json();
    return data.episodes || [];
  } catch (error) {
    console.error("Error fetching AnimeKai episodes:", error);
    return [];
  }
}

function CombineEpisodeMeta(episodeData, imageData) {
  const episodeImages = {};

  imageData.forEach((image) => {
    const episodeNum = image.number || image.episode;
    if (episodeNum) {
      episodeImages[episodeNum] = image;
    }
  });

  episodeData.forEach((episode) => {
    const episodeNum = episode.number;
    if (episodeNum in episodeImages) {
      const imageData = episodeImages[episodeNum];

      episode.image = imageData.img || imageData.image || null;
      episode.description = imageData.description || imageData.overview || imageData.summary || '';

      if (typeof imageData.title === 'object') {
        episode.title = imageData.title.en || imageData.title['x-jat'] || `Episode ${episodeNum}`;
      } else {
        episode.title = imageData.title || `Episode ${episodeNum}`;
      }
    }
  });

  return episodeData;
}

async function fetchEpisodeMeta(id) {
  if (!id) return [];

  try {
    const response = await fetch(`https://api.ani.zip/mappings?anilist_id=${id}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    return Object.values(data?.episodes || []);
  } catch (error) {
    console.error("Error fetching episode metadata:", error);
    return [];
  }
}
