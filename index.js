#!/usr/bin/node

import discord from "discord.js";
import dotenv from "dotenv";
import validator from "validator";
import OpenAI from "openai";

dotenv.config();

const client = new discord.Client({ "intents": [
	1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 1048576, 2097152, 16777216, 33554432 // fuck you and your stupid intents
] });

const provider = new OpenAI({
	"apiKey": process.env.API_KEY,
	"baseURL": "https://api.mistral.ai/v1"
});

client.on("messageCreate", async (msg) => {
	if (msg.type !== 7) { return; } // 7 = join message

	await msg.channel.sendTyping();

	const interval = setInterval(async () => {
		await msg.channel.sendTyping();
	}, 5000);

	let user = await msg.guild.members.fetch(msg.author.id);

	let messages = [
		{ "role": "system", "content": "You are an AI system, designed to predict the homosexuality of certain picked profiles with a high accuracy. Always respond in JSON, like this: { \"gay\": X } where X is a number between 0 and 100. The higher the number, the more gay the profile is." }
	];

	messages.push({ "role": "user", "content": "User profile:\n```json\n" + JSON.stringify(user) });

	if (user.avatar) {
		messages.push({ "role": "user", "content": [ { "type": "text", "text": "User avatar:" }, { "type": "image_url", "image_url": { "url": user.avatarURL({ format: "png", size: 1024 }) } } ] });
	}

	if (user.banner) {
		messages.push({ "role": "user", "content": [ { "type": "text", "text": "User banner:" }, { "type": "image_url", "image_url": { "url": user.bannerURL({ format: "png", size: 1024 }) } } ] });
	}

	messages.push({ "role": "user", "content": "Guild info:\n```json\n" + JSON.stringify(user.guild) + "\n```" });

	// TO-DO: check if this AI-generated junk works
	if (user.guild.icon) {
		messages.push({ "role": "user", "content": [ { "type": "text", "text": "Guild icon:" }, { "type": "image_url", "image_url": { "url": user.guild.iconURL({ format: "png", size: 1024 }) } } ] });
	}

	if (user.guild.banner) {
		messages.push({ "role": "user", "content": [ { "type": "text", "text": "Guild banner:" }, { "type": "image_url", "image_url": { "url": user.guild.bannerURL({ format: "png", size: 1024 }) } } ] });
	}

	messages.push({ "role": "assistant", "content": "{\n    \"gay\": ", "prefix": true});

	try {
		let response = await provider.chat.completions.create({
			"model": "pixtral-12b-2409",
			"messages": messages,
			"max_tokens": 20,
			"temperature": 0.1,
			"stop": [ "}" ]
		});

		clearInterval(interval);

		response = response.choices[0].message.content;

		console.log(response);

		let json = response + " }";

		console.log(json)

		json = JSON.parse(json);

		json.gay = Number(json.gay); // just in case the LLM is gay and can't produce a number

		if (isNaN(json.gay)) {
			throw new Error();
		}

		await msg.reply(`Analysis complete. Results: <@${user.id}> is \`${json.gay}\`% gay.`).catch(() => {});
	} catch (error) {
		clearInterval(interval);
		await msg.reply("An error occurred. You are too gay for me to handle.");
		console.error(error);
		return;
	}
});

client.login(process.env.TOKEN);

client.on("ready", () => {
	console.log("ready to ruin some lives as", client.user.tag);
});