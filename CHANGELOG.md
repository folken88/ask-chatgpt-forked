# Changelog

All notable changes to the project will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.0] - 2024-11-11

### Added

- **New Module Name**: Updated module title to "Ask-GPT Updated."
- **Compatibility Update**: Increased minimum compatibility to FoundryVTT version 11.
- **Support for Pathfinder 1e**: Added specific pre-prompt for Pathfinder 1st Edition to ensure responses are accurate, including content from the SRD and Archives of Nethys.
- **Fetch Available Models**: Added a button in the settings UI to fetch the current available GPT models from OpenAI API.
- **Clear and Load History**: Added buttons to settings to clear and load conversation history.
- **UI Improvements**: Added buttons for users to interact with history and manage settings directly from the module settings UI.

### Changed

- **Improved GPT Model Selection**: The settings UI now includes a button to dynamically fetch available models, ensuring up-to-date options for the user.
- **Enhanced Chat Hooks**: Updated chat command handling for public and private messages to integrate with the newly added functionalities.
- **Version Upgrade**: Updated version to `2.0` to reflect significant changes and new features.

### Fixed

- **Error Handling**: Improved error handling for failed GPT model fetch requests, with better feedback to users.

## [0.1.1] - 2023-04-26

### Added

- Initial implementation.
- Public `/?` and whispered `/w gpt` messages to ChatGPT.
- Hide OpenAI API key value in settings.
- ChatGPT model version selection.
- Conversation support by preserving ChatGPT messages context.
  Customizable context length for API usage cost optimization.
- Basic game systems support for D&D 5e, Pathfinder 2e, and Ironsworn.
  Automatic game system detection.
- Customizable ChatGPT prompt.
- HTML formatted ChatGPT responses in the chat log with selectable text.
- Proper OpenAI API error handling and reporting.

[2.0]: https://github.com/vizovitin/foundryvtt-ask-chatgpt/releases/tag/2.0
[0.1.1]: https://github.com/vizovitin/foundryvtt-ask-chatgpt/releases/tag/0.1.1