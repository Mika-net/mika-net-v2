---
title: "Misadventures in SMTP and IMAP"
description: "When privacy concerns lead to exploring self-hosted email servers and encrypted email services. Tonight's cast include AWS, Gmail, and ProtonMail."
pubDate: 2022-12-26
pillar: architecture
tags: [email, self-hosting, aws]
heroImage: ./cover.jpg
heroAlt: "Misadventures in SMTP and IMAP"
---
Roughly two years ago I began a journey in privacy, to separate myself from using services where my personal information, my habits and patterns where the product. The first step I decided to go on with this was communication, starting with email and secure messaging applications. Having been a user of Gmail for the majority of my life, I decided that would be the first migration I made.

When selecting a new email service with the primary concern of privacy lead me to [ProtonMail](https://proton.me/ "ProtonMail"). It’s currently the most popular option for secure email, and it’s feature’s and privacy focus was what I was looking for. In addition it would allow me to easily create and manage a number of email addresses for various tasks, including having an email using this domain which is something I always thought would be neat.

Doing this really only took a few DNS records with [AWS Route 53 ](https://aws.amazon.com/route53/ "Route 53") as that was the service I had my domains registered with. Following that I started importing my prior inbox’s to ProtonMail using their easy switch tool. The process took some time but left me the ability to start moving every login, account and anything else over to my new email.
