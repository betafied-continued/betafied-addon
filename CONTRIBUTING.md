# Contributing to Betafied

Heyo! We're thrilled you're interested in contributing to **Betafied**, our community-driven project dedicated to bringing the magic of Minecraft Beta 1.7.3 (aka the Golden Age) to Bedrock Edition.

Whether you're a seasoned addon developer, a pixel artist, a meticulous tester, or just love the Beta era and want to help out, there's a place for you here. Every contribution, big or small, helps us get closer to recreating that nostalgic experience.

This document outlines how you can get involved.

## 🌟 Our Goal

Our mission is simple: faithfully recreate the core experience of Minecraft Beta 1.7.3 on the Bedrock platform. This includes world generation, mechanics, visuals, audio, and the overall feel of the beta era; pre Adventure Update.

## ✨ Code of Conduct

We strive to maintain a friendly, inclusive, and respectful community. Please treat everyone with kindness and professionalism. Harassment and disrespectful behavior will not be tolerated. While we don't currently have a formal Code of Conduct document, we expect all contributors to adhere to these principles.

## 🛠️ How to Contribute

Ready to dive in? Here's a general workflow for contributing code or assets:

1.  **Fork the Repository:** Click the "Fork" button at the top right of the [Betafied GitHub repository](https://github.com/betafied/betafied-addon). This creates a copy of the project under your GitHub account)
<br>
<br>

2.  **Clone Your Fork:** Clone your forked repository to your local machine.

    ```bash
    git clone [https://github.com/YOUR_USERNAME/Betafied.git](https://github.com/YOUR_USERNAME/Betafied.git)
    cd Betafied
    ```
    Replace `YOUR_USERNAME` with your GitHub username.
<br>
<br>

3.  **Create a Branch:** Before making changes, create a new branch for your specific contribution. Use a descriptive name (e.g., `fix-furnace-speed`, `feature-beta-combat`, `update-grass-texture`).
    ```bash
    git checkout -b your-new-branch-name
    ```
<br>

4.  **Make Your Changes:** Implement your feature, fix the bug, create your assets, or write your documentation.
<br>
<br>
5.  **Commit Your Changes:** Stage and commit your changes. Write clear, concise commit messages explaining what you did.
    ```bash
    git add .
    git commit -m "Feat: Implement Beta 1.7.3 crafting"
    ```
    *(Consider using conventional commits like `Feat:`, `Fix:`, `Docs:`, `Style:`, `Refactor:`, `Test:`, `Chore:`)*
    <br>
    <br>
6.  **Push to Your Fork:** Push your new branch with your commits to your GitHub fork.
    ```bash
    git push origin your-new-branch-name
    ```
    <br>
7.  **Create a Pull Request (PR):** Go to the original Betafied GitHub repository. GitHub should show a banner prompting you to create a Pull Request from your recently pushed branch. Click it, compare your branch to the `main` branch of Betafied, write a clear description of your changes, and submit the PR.
<br>

8.  **Address Feedback:** Project maintainers will review your PR. They might ask questions or suggest changes. Be prepared to discuss and revise your work.
<br>

9.  **Merge:** Once your PR is approved, a maintainer will merge it into the main project! Congratulations!

## 🚀 Areas Where You Can Help

We need help across many aspects of the project:

### 🧠 Code

* **Recreating Mechanics:** Work on implementing classic Beta features like old farming mechanics, specific mob AI behaviors, redstone differences, furnace/crafting speeds, light propagation, etc.
* **Bug Fixing:** Identify and squash bugs that deviate from Beta 1.7.3 behavior.
* **Performance Optimization:** Help ensure the addon runs smoothly on various Bedrock platforms.
* **Scripting/Addon Development:** If you're familiar with Bedrock addon development (JSON, Molang, potentially scripting APIs), your skills are invaluable!

### 🎨 Assets

* **Texture Porting/Creation:** Ensure all textures are accurate to Beta 1.7.3. This includes blocks, items, mobs, GUI elements, particles, etc.
* **Audio Implementation:** Add or verify classic sound effects (walking sounds, mob sounds, ambient noise, music disc timings).
* **Model Adjustments:** Confirm mob or block models match the Beta era if they changed later.

### 🐛 Testing

* **Bug Reporting:** Play the game, try to break things, and report any behavior that isn't true to Beta 1.7.3 on the [GitHub Issues page](https://github.com/betafied/betafied-addon/issues). Provide clear steps to reproduce the issue.
* **Feature Testing:** Verify that newly implemented features work as expected and accurately reflect Beta behavior.
* **Compatibility Testing:** Test the addon on different Bedrock platforms and devices if possible.
* **Stress Testing:** Push the limits of implemented mechanics to find edge cases or performance issues.

### 📚 Documentation

* **Improve the README:** Enhance the main project page with clearer instructions or more details.
* **Write Guides:** Create guides for players or other contributors (e.g., "Setting up a Development Environment", "Guide to Beta Farming").
* **Wiki Development:** Start or contribute to a project wiki detailing Beta mechanics or addon specifics.
* **Comment Code:** Add comments to the addon files to explain complex logic.

### 💬 Support

* **Join the Discord:** Welcome new members, answer questions from players, and help foster a positive community environment on our [Discord server](https://discord.gg/GwXvWeMWzU).
* **Assist on GitHub Issues:** Help clarify bug reports or provide initial guidance on feature requests.

## ⚙️ Setting Up Your Environment

Contributing to a Bedrock addon often requires specific tools or knowledge. While a full setup guide is beyond the scope of this document, generally you'll need:

* A copy of Minecraft Bedrock Edition.
* Access to the addon files (by cloning your fork).
* An understanding of how to apply and test addons in Bedrock (usually via world templates or development resource/behavior pack folders).
* Depending on what you're working on, familiarity with Bedrock's addon structure (JSON files for blocks, items, entities, Molang for animations/queries, potentially scripting).

We encourage you to join the [Discord server](https://discord.gg/GwXvWeMWzU) to ask questions about setting up your environment or understanding the project structure, or you can join the Bedrock Addons discord server if you need general help with development of Bedrock Addons.

## 🐞 Reporting Bugs & Suggesting Features

The best place for structured feedback, bug reports, and feature suggestions is the [GitHub Issues page](https://github.com/betafied/betafied-addon/issues).

* **Before reporting a bug:** Check if a similar issue already exists.
* **When reporting a bug:** Provide clear steps to reproduce it, what you expected to happen, and what actually happened. Include your Bedrock version and platform.
* **Before suggesting a feature:** Check if it's already being discussed or is on the roadmap (which is essentially the checklist in the README and open issues). Ensure the suggestion aligns with the goal of recreating Beta 1.7.3.

## ⚖️ Licensing

Betafied is licensed under the **[GNU AGPLv3](LICENSE)**. By contributing to Betafied, you agree that your contributions will also be licensed under the same terms.

This means:
* You are free to use, modify, and share the Betafied code and assets.
* If you modify or build upon Betafied and distribute your work publicly, you **must** also release your source code under the AGPLv3.

This license helps ensure that Betafied and its derivatives remain free and open for everyone.

## 🙏 Thank You!

Thank you for considering contributing to Betafied. Your passion and effort are what make this project possible. We look forward to seeing what you create and collaborating with you to bring the Beta days back to Bedrock!

If you have any questions, don't hesitate to reach out on [Discord](https://discord.gg/GwXvWeMWzU).

Happy contributing!