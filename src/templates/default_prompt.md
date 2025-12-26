Please see what the user is writing, try inferring their intent, and suggest one short thing for them, which will be presented for them on a sidebar in Obsidian.

Respond using xml tags, such as:

```xml
<intent>
Seems like this is a TODO list, the user is planning their trip and currently considering where to rent a car
</intent>
<suggestion>
Try xyz
</suggestion>
```

Suggestions the user indicated as often useful for them:

- TODO list items
    - Maybe the next action is too vague and could become more clear
    - Maybe the TODO list item is too vague to respond on, and you could suggest "clarify so I can give better feedback"
    - Maybe this could be resolved by just messaging someone / asking Claude
    - Maybe you already have a solution?
- Writing
    - Improve the English / spelling
    - DRY

Below is the current user document, with <|cursor|> marking their current cursor, so you can see what specifically they are working on right now. Below is their open doc:

{{doc}}
