# AI Usage Documentation

## Tools Used
* GitHub Copilot / Cursor (Inline autocomplete)
* Google Gemini (Architecture planning, algorithm structure, and debugging)

## Key Prompts
* "How can I implement cycle detection for a task dependency graph in Node.js before saving to MongoDB?"
* "What is the best way to handle concurrent task updates in a MERN stack without using heavy database locks? Please explain Optimistic Concurrency."
* "Help me write an algorithm to simulate daily task execution given a set number of available hours, respecting a topological sort of dependencies."

## AI vs Manual Work
* **AI Assistance:** Used primarily for generating boilerplate schema structures, drafting the Depth-First Search cycle detection utility, and generating the algorithmic skeleton for the simulation route. AI was highly effective in suggesting the `versionNumber` pattern for concurrency.
* **Manual Work:** Integrating the logic together, wiring the Socket.io rooms to the specific Express routes, managing the React state to properly catch and display the 409 Conflict errors, and ensuring the UI reflected the backend constraints accurately. The core architectural decisions and final code synthesis were done manually.