#!/usr/bin/node

const discord = await import('discord.js')
const dotenv = await import('dotenv')
const { Mistral } = await import('@mistralai/mistralai')

dotenv.config()

const client = new discord.Client({
  intents: [
    1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 1048576, 2097152, 16777216, 33554432 // fuck you and your stupid intents
  ]
})

const mistral = new Mistral()

function reJSON (obj) {
  return JSON.parse(JSON.stringify(obj))
}

// analyse a GuildMember
async function analyse (guildMember) {
  const messages = [
    {
      role: 'system',
      content:
`You are an AI designed to predict the likelihood of a profile being gay based on various factors. Respond in JSON format: { "analysis": X, "rating": Y } where:

- \`X\` is your analysis of the user profile.
- \`Y\` is a number between 0 and 100 (0 = straight, 100 = gay).

If you are not certain, bias towards a score of 0 (straight). Pansexuals are 50% gay by default.`
    }
  ]

  const user = await guildMember.user.fetch()
  const guild = await guildMember.guild.fetch()

  if (user.id === '531045397649555468') {
    await new Promise(resolve => setTimeout(resolve, (Math.random() * 5000) + 10000))
    throw new TypeError('Cannot convert Infinity to a Number') // save an API request for known value
  }

  const output = {}

  output.guild = reJSON(guild)
  output.guild.members = reJSON(guild.members.cache.map(member => member.user.tag))
  output.guild.channels = reJSON(guild.channels.cache.map(channel => channel.name))
  output.guild.roles = reJSON(guild.roles.cache.map(role => role.name))
  output.guild.emojis = reJSON(guild.emojis.cache.map(emoji => emoji.name))
  output.guild.stickers = reJSON(guild.stickers.cache.map(sticker => sticker.name))

  output.user = reJSON(guildMember)

  output.user.roles = reJSON(guildMember.roles.cache.map(role => role.name))

  messages.push({ role: 'user', content: [{ type: 'text', text: '```json\n' + JSON.stringify(output, null, 4) + '\n```' }] })

  const config = { format: 'png', size: 1024 };

  [
    { type: 'text', text: 'User avatar:', imageUrl: user.avatarURL(config) },
    { type: 'text', text: 'User banner:', imageUrl: user.bannerURL(config) },
    { type: 'text', text: 'Guild icon:', imageUrl: guild.iconURL(config) },
    { type: 'text', text: 'Guild banner:', imageUrl: guild.bannerURL(config) }
  ].forEach(element => {
    if (element.imageUrl && !element.imageUrl.includes('.gif')) {
      messages.push({ role: 'user', content: [element] })
    }
  })

  messages.push({ role: 'assistant', content: '{ "analysis": ', prefix: true }) // I'm sorry, but as a large language model trained by OpenAI, I cannot help with that. Is there anything else I can help you with?

  // console.dir(messages, { 'depth': Infinity })

  // debugger

  let analysis = await mistral.chat.complete({
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

  // const deviation = Number(((Math.random() * 10) - 5).toFixed(2));
  // analysis.analysis = analysis.analysis.replaceAll(analysis.rating.toString(), (analysis.rating + deviation).toString());
  // analysis.rating = analysis.rating + deviation;

  analysis.rating = Math.max(0, Math.min(100, analysis.rating))

  return analysis
}

async function handleError (msg, error) {
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

  if (msg.author.id === client.user.id) { return }

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
