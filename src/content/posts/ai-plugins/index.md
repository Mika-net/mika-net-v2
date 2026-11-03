---
title: "How I Learned to Stop Worrying and Love the AI."
description: "How effective use of AI plugins can rapidly increase your productivity and code quality. Tonight's cast includes GitHub Copilot, Kite, Tabnine and SonarQube."
pubDate: 2022-12-28
pillar: ai-engineering
tags: [ai, tooling]
heroImage: ./cover.jpg
heroAlt: "How I Learned to Stop Worrying and Love the AI."
---
Within the last few years more and more tools are becoming available to developers that would have felt like science fiction not that long ago. We have access to AI powered tools like GitHub’s copilot, Kite, Tabline and many more AI  plugins that can improve your code and its quality. Further popular IDE’s like Visual Studios and JetBrains Rider are coming equipped with similar functionality built in.

Static Code Analysis tools have been around even longer and have been widely adopted in larger projects to ensure quality, with SonarQube, DeepSource and others being fixtures in many of our professional lives. The adoption and use of these tools does more for code quality than just keep code smells away, but the can find bugs that human developers can and do miss. However do not fall into the trap of blindly accepting the opinions of such tools, if you don’t understand what the tool is pointing out, why it is an issue and if it is an issue in reality. Doing so is like using a calculator without a fundamental understanding of the underlying mathematic principles and can lead to poor outcomes.

> “Simplicity is the soul of efficiency.” – Austin Freeman

When working today I find myself using many of these tools specifically to make sure of a few things in my software, code standards are followed, logic is simplified when possible, and that unused or impossible conditions are removed. Most of these tools will allow you to identify and make the desired changes with only a single click. Can help you fix issues regarding code consistency and quality. Just the other day when trying to track the source of a bug I ran into a rather lengthy block of code that would have required a close look to uncover the logical issue, but my tools where able to find the error in logic and even the inconsistent usage of == and === which in JS does have ramifications that should be properly understood. Using these tools I was able to find, fix, and resolve an issue in less than 5 minutes time with the added benefit of fixing a number of lintr issues in seconds.  Having an understanding of the tools you use, the effect they have on your preformance, and how you can leverage them best is an essential part of being a developer today.
