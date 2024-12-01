# Mistral-based Discord gaydar
- Why Mistral? I can't be bothered finding another providing which has both a model that accepts multiple images and allows assistant message prefilling to force it to generate a rating, instead of refusing on some non-sensical content policy.

## Required environment variables:
- `DISCORD_TOKEN`: Discord bot token
- `API_KEY`: your Mistral AI API key

## Functional principle
- Listen for join messages, then assign that person a gayness rating.

## Check a user manually
```
node index.js --manual <GUILD_ID> <USER_ID>
```

## Caching
- To store analysis results for quicker retrieval, create an empty JSON file named `cache.json` with the initial content of `{}`.
- Values in the cache will be trusted blindly. If you want to troll your friends, create an entry like this in the cache:
```json
{
	...
	"<GUILD_ID>,<USER_ID>": X,
	...
}
```
where `<GUILD_ID>` is the guild ID, `<USER_ID>` is the user ID, and `X` is the rating you want to assign to that user.

## Satisfied customer testimonials
![testimonials/1.png](testimonials/1.png)
![testimonials/2.png](testimonials/2.png)
![testimonials/3.png](testimonials/3.png)
![testimonials/4.png](testimonials/4.png)
![testimonials/5.png](testimonials/5.png)
![testimonials/6.png](testimonials/6.png)