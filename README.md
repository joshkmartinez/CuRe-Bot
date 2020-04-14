# CuRe Bot

### **Cu**stom **Re**sponse Bot

CuRe your FAQs with CuRe Bot!  
CuRe Bot is a custom response bot for discord (similar to slackbot's custom responses 😄).  
Just set up message triggers, and CuRe bot will faithfully respond.  
CuRe bot is designed and intended for support communities. Simply set a trigger (like: "open a ticket") and a response like "You can open a ticket with the `;;ticket open help` command).  
Check out an example below!

To invite the bot to your server, go to this link: https://curebot.dev/invite

Commands:

- `?help`
- `?create your trigger - your response`
  - This command creates a trigger. Whenever a user sends a message containing the "trigger" string, the bot will respond with the "response" string.
- `?list`
  - Shows a list of the triggers and responses on the server.
- `?delete index`
  - Deletes a trigger from the server. To get the trigger's index, use the `?list` command.
- `?ping`

Some notes:

- Messages sent by bots and messages containing the bot's prefix (which is `?` if you cannot already tell.) as the first character will not be searched for message triggers.
- Your messages are not saved by CuRe Bot in any way. Don't believe me? Take a look at [the code](https://github.com/joshkmartinez/CuRe-Bot) for yourself.

Here is an example of CuRe bot in action!  
![Example](https://media.giphy.com/media/j0B3l7xKAVezqvUShk/giphy.gif)  
This was done with the following trigger & response.  
Trigger: "open a ticket"  
Response: "You can open a ticket with the `;;ticket open help` command
