# Counting Bot
Just another random TypeScript Discord bot. This was originally a feature being worked on for another project, [Sage](https://github.com/ud-cis-discord/Sage), that ended up getting scrapped.

It tracks a specified channel and ensures the only messages that get sent are numbers increasing sequentially, message after message. The count breaks if
- A user sends a number lower or higher than the intended next number
- A user sends the next number, but with an attachment or content after the number
- The same user counts twice in a row
- Any user deletes or edits a message sent after the count started

![i](https://i.imgur.com/LZIwH82.png)