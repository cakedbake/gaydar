# Mistral-based Discord gaydar
- Why Mistral? I can't be bothered finding another providing which has both a model that accepts multiple images and allows assistant message prefilling to force it to generate a rating, instead of refusing on some non-sensical content policy.

## Environment variables:
- `DISCORD_TOKEN`: Discord bot token
- `MISTRAL_API_KEY`: your Mistral AI API key
- `GIF`: (optional) the complimentary GIF to be dispensed after 10 seconds in case of failure.

## Functional principle
- Listen for join messages, then assign that person a gayness rating along with an explanation.

## Invocation
1. User join messages (type 7)
2. @Gaydar @target
3. `node index.js --probe <GUILD_ID> <USER_ID>`

## Satisfied customer testimonials
![testimonials/1.png](testimonials/1.png)
![testimonials/2.png](testimonials/2.png)
![testimonials/3.png](testimonials/3.png)
![testimonials/4.png](testimonials/4.png)
![testimonials/5.png](testimonials/5.png)
![testimonials/6.png](testimonials/6.png)