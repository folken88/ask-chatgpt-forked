# Ask-GPT Updated

Customizable ChatGPT integration for Foundry VTT, updated and maintained by Folken Games.

![Foundry VTT 11](https://img.shields.io/badge/Foundry_VTT-v11-informational?style=flat-square) ![GitHub all releases downloads](https://img.shields.io/github/downloads/folken-games/foundryvtt-ask-gpt-updated/total?label=downloads%40total&style=flat-square) ![GitHub latest release downloads](https://img.shields.io/github/downloads/folken-games/foundryvtt-ask-gpt-updated/latest/total?style=flat-square) ![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/folken-games/foundryvtt-ask-gpt-updated/ci.yml?label=ci&logo=github&style=flat-square)

## Installation

You can install the module using the following manifest URL:

`https://github.com/folken-games/foundryvtt-ask-gpt-updated/releases/latest/download/module.json`

## How to use

First enter your [OpenAI API key](https://platform.openai.com/account/api-keys) in the module settings.
Some popular game systems, such as [D&D 5e](https://foundryvtt.com/packages/dnd5e) are automatically detected and supported without additional customizations. For others, you may customize the ChatGPT prompt.

After that, simply ask ChatGPT in the Foundry VTT chat!

Ask command `/?` will make the question and reply visible to all:

> GM: /? what's the cost of standing up from prone?

> GPT: Standing up from prone costs half of your movement speed.

Whisper command `/w gpt` will make the question and reply visible only to the sender and additional recipients:

> Player: /w [gpt, gm] time to don and doff armor

> GPT: According to the rules in the Player's Handbook, donning and doffing armor takes a specific amount of time depending on the type of armor:
>
> | Armor Type   | Donning Time | Doffing Time |
> | ------------ | ------------ | ------------ |
> | Light Armor  | 1 minute     | 1 minute     |
> | Medium Armor | 5 minutes    | 1 minute     |
> | Heavy Armor  | 10 minutes   | 5 minutes    |
> | Shield       | 1 action     | 1 action     |

## How it works

This module sends questions from the corresponding `/?` and `/w gpt` commands to the ChatGPT and (generally) properly formats replies. It is also possible to have multi-message conversations with ChatGPT, provided context length is increased in the module settings. Note that ChatGPT is not aware of other messages in the chat log or any other objects in your game.

ChatGPT behavior is primarily governed by a prompt, which by default depends on your game system, but may also be overridden in the module settings.

Note that while ChatGPT is aware of several game system rulesets, adventures, items, creatures, and so on, it may and will occasionally provide false information. However, it's a great tool for DMs to use for inspiration and quick generation of various bits of information.

> Note: Due to the way Foundry VTT modules function, your OpenAI API key is not really secret from your players.

## Changes in Ask-GPT Updated

This fork, maintained by Folken Games, includes the following significant updates and improvements:

### New Features Added

- **Pathfinder 1e Support**: Added specific support for Pathfinder 1st Edition, ensuring proper prompts are used based on SRD and Archives of Nethys. This addition helps provide system-specific responses and reduces the risk of confusion between Pathfinder 1e and 2e.
- **Fetch Available Models**: Introduced a button in the settings to fetch the current available GPT models from the OpenAI API. This makes selecting the latest models easier and keeps your module up-to-date.
- **Clear and Load History Buttons**: Added buttons in the settings to manage chat history, allowing users to easily clear or load conversation history.

### Improvements

- **Compatibility**: Updated module to be compatible with Foundry VTT version 11.
- **New Module Name**: Renamed to "Ask-GPT Updated" to reflect the continuation and improvement of the original module.
- **Model Selection**: Improved model version selection with a new UI button that dynamically fetches available models, ensuring users always have access to the latest OpenAI offerings.

### Reasons for Changes

- **User Convenience**: The changes to the model selection and chat history buttons were made to improve user convenience, making it easier to manage the conversation context and keep the module up-to-date.
- **Pathfinder Community**: Adding support for Pathfinder 1e was aimed at benefiting the Pathfinder community by providing a better in-game assistant that understands the specific rules of the system.
- **Compatibility and Future-Proofing**: Upgrading compatibility to Foundry VTT version 11 ensures that the module continues to work seamlessly with the latest versions of Foundry, keeping it relevant for new and existing users.

## Acknowledgements

This module is based on the original work by [Nikolay Vizovitin](https://github.com/vizovitin/foundryvtt-ask-chatgpt). Inspired and partially based on [gpt4-dnd5e](https://github.com/ctbritt/gpt4-dnd5e).

Thanks to [OpenAI](https://openai.com) for their incredible AI tools, and to the Foundry VTT community for their ongoing support and inspiration.

