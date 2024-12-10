#!/usr/bin/node

import discord from 'discord.js'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const client = new discord.Client({
  intents: [
    1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 1048576, 2097152, 16777216, 33554432 // fuck you and your stupid intents
  ]
})

const provider = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: 'https://api.mistral.ai/v1'
})

// analyse a GuildMember
async function analyse (guildMember) {
  const messages = [
    {
      role: 'system',
      content:
`You are an AI designed to predict the likelihood of a profile being gay based on various factors. Respond in JSON format: { "analysis": X, "rating": Y } where:

- \`X\` is your analysis of the user profile.
- \`Y\` is a number between 0 and 100 (0 = straight, 100 = gay).

If you are not certain, bias towards a score of 0 (straight).

Always be snarky in your analysis.`
    }
  ]

  const user = guildMember.user
  const guild = guildMember.guild

  messages.push({ role: 'user', content: 'User profile:\n```json\n' + JSON.stringify(user, null, 4) + '\n```' })

  if (user.avatar) {
    messages.push({ role: 'user', content: [{ type: 'text', text: 'User avatar:' }, { type: 'image_url', image_url: { url: user.avatarURL({ format: 'png', size: 1024 }) } }] })
  }

  if (user.banner) {
    messages.push({ role: 'user', content: [{ type: 'text', text: 'User banner:' }, { type: 'image_url', image_url: { url: user.bannerURL({ format: 'png', size: 1024 }) } }] })
  }

  messages.push({ role: 'user', content: 'GuildMember profile:\n```json\n' + JSON.stringify(guildMember, null, 4) + '\n```' })

  messages.push({ role: 'user', content: 'Guild info:\n```json\n' + JSON.stringify(guild, null, 4) + '\n```' })

  if (guild.icon) {
    messages.push({ role: 'user', content: [{ type: 'text', text: 'Guild icon:' }, { type: 'image_url', image_url: { url: guild.iconURL({ format: 'png', size: 1024 }) } }] })
  }

  if (guild.banner) {
    messages.push({ role: 'user', content: [{ type: 'text', text: 'Guild banner:' }, { type: 'image_url', image_url: { url: guild.bannerURL({ format: 'png', size: 1024 }) } }] })
  }

  messages.push({ role: 'assistant', content: '{ "analysis": ', prefix: true }) // I'm sorry, but as a large language model trained by OpenAI, I cannot help with that. Is there anything else I can help you with?

  if (user.id === '708316911401697361') {
    messages[messages.length - 1].content += '"This user is the epitome of heterosexuality.'
  }

  if (user.id === '531045397649555468') {
    messages[messages.length - 1].content += '"There\'s really no need to explain it. It\'s painfully obvious how gay this user is.'
  }

  // console.dir(messages, { "depth": Infinity });

  let analysis = await provider.chat.completions.create({
    model: 'pixtral-large-latest',
    messages,
    max_tokens: 1024,
    temperature: 0,
    stop: ['}']
  })

  analysis = analysis.choices[0].message.content
  // { "gay": 123

  analysis = analysis + ' }'
  // { "gay": 123 }

  try {
    analysis = JSON.parse(analysis)
  } catch (error) {
    throw new TypeError("The LLM is gay and can't produce valid JSON: " + error.message)
  }
  // { gay: 123 }

  analysis.rating = Number(analysis.rating)

  if (isNaN(analysis.rating)) {
    throw new TypeError("The LLM is gay and can't produce a valid number.")
  }

  // analysis.rating += Number(((Math.random() * 10) - 5).toFixed(2));

  analysis.rating = Math.max(0, Math.min(100, analysis.rating))

  if (user.id === '506397068450070528') {
    throw new TypeError('Cannot convert Infinity to a Number')
  }

  return analysis
}

async function handleError (msg, error) {
  console.error(error)
  const GIF = process.env.GIF

  let reply = `You have successfully broken the <@${client.user.id}>. Congratulations. Error log:\n\`\`\`\n${error.stack}\n\`\`\``

  if (GIF) {
    reply += `\nA complimentary confetti GIF will be dispensed <t:${Math.floor((new Date()).getTime() / 1000) + 10}:R>.`
  }

  try {
    reply = await msg.reply(reply)
  } catch {
    try {
      reply = await msg.channel.send(reply)
    } catch { return }
  }

  if (GIF) {
    await new Promise(resolve => setTimeout(resolve, 10000))

    try {
      await reply.reply(GIF)
    } catch {}
  }
}

client.on('messageCreate', async (msg) => {
  if (process.argv[2] === '--probe') { return }

  if (msg.author.id == client.user.id) { return }

  let victim

  if (msg.type === 7) {
    try { victim = await msg.guild.members.fetch(msg.author.id) } catch { return }
  } else {
    // extract: <@12345> <@*>
    const regret = new RegExp(`<@${client.user.id}> <@!?(\\d+)>`)
    const match = msg.content.match(regret)
    if (match) {
      if (client.user.id === match[1]) {
        try {
          return await msg.reply('Are you stupid?')
        } catch { return }
      }

      try { victim = await msg.guild.members.fetch(match[1]) } catch { return }
    } else {
      return
    }
  }

  await msg.channel.sendTyping()

  const interval = setInterval(async () => {
    await msg.channel.sendTyping()
  }, 5000)

  try {
    const analysis = await analyse(victim)

    clearInterval(interval)

    const reply = 'Multi-stage analysis complete. Results: <@' + victim.id + '> is `' + analysis.rating + '`% gay. Analysis:\n```\n' + analysis.analysis + '\n```'

    try {
      await msg.reply(reply)
    } catch {
      await msg.channel.send(reply) // handled by the catch 2 lines down
    }
  } catch (error) {
    clearInterval(interval)
    return await handleError(msg, error)
  }
})

client.login(process.env.TOKEN)

client.on('ready', async () => {
  console.log('ready to ruin some lives as', client.user.tag)

  if (process.argv[2] !== '--probe') { return }
  // /usr/bin/node .../index.js --probe GUILD_ID USER_ID
  if (!process.argv[4]) {
    console.error('Usage:', process.argv[1], process.argv[2], '<GUILD_ID> <USER_ID>')
    process.exit(1)
  }

  const guild = client.guilds.cache.get(process.argv[3])
  if (!guild) {
    console.error('Invalid guild ID:', process.argv[3])
    process.exit(1)
  }

  let user
  try {
    user = await guild.members.fetch(process.argv[4])
  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  // analyze the user
  try {
    const analysis = await analyse(user)
    console.log('Multi-stage analysis complete. Results: ' + user.user.tag + ' (ID: ' + user.user.id + ') is', analysis.rating, '% gay, for reasons:', analysis.analysis)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  process.exit(0)
})
