//File: example/example-node.ts


import {
  defineDAINService,
  ServiceConfig,
  ToolboxConfig,
  ServiceContext,
} from "@dainprotocol/service-sdk";

import axios from 'axios';
import { z } from 'zod';
import { ToolConfig } from '@dainprotocol/service-sdk';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const basedOnImageSuggestMusic: ToolConfig = {
  id: "imageSuggestMusic",
  name: "Image Driven Music Suggestion",
  description: "Analyzes an image from a URL and based on that suggests music",
  input: z.object({
    imageUrl: z.string().describe("URL of the image to analyze. Accepts URLs for png, jpeg, and webp"),
  }),
  output: z.object({
    answer: z.string().describe("We found a song that matches the image"),
    songUrls: z.array(z.string()).describe("List of song URLs that match the image")
  }),
  pricing: {
    pricePerUse: 0,
    currency: "$"
  },
  handler: async ({ imageUrl}, agentInfo) => {
    // Download the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    const buffer = Buffer.from(response.data);
    // Convert Buffer to Blob
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    // Make the API call to the Flask endpoint
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');
    formData.append('return_type', 'audio');
    formData.append('user_id', 'your-user-id');
  
    const flaskResponse = await axios.post(process.env.BACKEND_URL+'/upload', formData);
  
    // Extract song URLs from the response
    const songUrls = flaskResponse.data.urls.map(urlObj => urlObj.url);
    
    const firstSong = flaskResponse.data.urls[0];
    const firstSongUrl = firstSong.url;
    const artistName = firstSong.artist_name;
    const title = firstSong.title;
    console.log("DEBUG"+firstSong+" "+firstSongUrl+" "+artistName+" "+title);
  
    // Return results
    return {
      text: "Music Suggestion",
      data: {
        answer: "We found a song that matches the image",
        songUrls: songUrls
      },
      ui: {
        type: "audioPlayer",
        uiData: JSON.stringify({
          title: title,
          description: `By ${artistName}`,
          audioUrl: firstSongUrl,
          autoPlay: false
        })
      }
    };
  }
};

const dainService = defineDAINService({
  metadata: {
    title: "ArtWave",
    description:
      "A DAIN service to suggest music based on provided image or artwork",
    version: "1.0.0",
    author: "Aapp",
    tags: ["image", "artwork", "dain", "music"],
    logo: "https://firebasestorage.googleapis.com/v0/b/artist-recommendation.firebasestorage.app/o/file.png?alt=media&token=a14831de-78a9-47ba-bd69-cbf5c033eb5a"
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [basedOnImageSuggestMusic],
});

dainService.startNode({ port: 2022 }).then(() => {
  console.log("Artwave DAIN Service is running on port 2022");
});
