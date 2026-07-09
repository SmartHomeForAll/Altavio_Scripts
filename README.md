# Altavio Scripts

A community-driven collection of **smart home automation script examples** for professional installers and integrators.

Whether you're commissioning a Home Assistant setup, configuring Shelly relays on site, or wiring up Tuya devices, this repository aims to give you ready-to-use, field-tested script examples you can adapt to your projects.

## What's Inside

| Folder | Description |
|---|---|
| [`Home_Assistant/`](Home_Assistant) | Automations, blueprints, and scripts for [Home Assistant](https://www.home-assistant.io/) |
| [`Shelly/`](Shelly) | Scripts and configuration examples for [Shelly](https://www.shelly.com/) devices (mJS scripting, MQTT, webhooks) |
| [`Tuya/`](Tuya) | Automation examples and integration snippets for [Tuya](https://www.tuya.com/)-based devices |

More platforms may be added over time — contributions for new ecosystems are welcome!

## Who Is This For?

- **Smart home installers** looking for proven automation patterns to deploy at customer sites
- **System integrators** combining multiple ecosystems into one coherent installation
- **Enthusiasts and DIYers** who want real-world examples beyond the basics

## Getting Started

1. Browse the folder for your platform.
2. Open the example that matches your use case — each example should include a short description of what it does and how to use it.
3. Copy the script into your environment and adjust device names, entity IDs, or credentials to match your installation.
4. Test thoroughly before deploying to a customer site.

> **Note:** Always review scripts before running them in a production installation. Device firmware versions and platform updates can change behavior.

## Contributing

This is an open source project — **anyone can contribute!** We especially welcome:

- New automation examples (even small ones — simple, well-explained scripts are valuable)
- Improvements or fixes to existing scripts
- Documentation improvements
- Examples for additional platforms

### How to Contribute

1. **Fork** this repository.
2. **Create a branch** for your change (`git checkout -b my-new-example`).
3. **Add your script** in the appropriate platform folder. Please include:
   - A descriptive file name
   - A comment header or accompanying `README.md` explaining what the script does, requirements, and any setup steps
4. **Commit and push** your changes.
5. **Open a Pull Request** describing your contribution.

Found a bug or have an idea? [Open an issue](../../issues) — questions and suggestions are welcome too.

### Contribution Guidelines

- Remove any personal data (IP addresses, tokens, credentials, MAC addresses) before submitting.
- Use clear, generic device/entity names in examples (e.g. `light.living_room` instead of customer-specific names).
- Keep examples focused — one use case per script where possible.

## License

This project is open source. All contributions are shared with the community — see the repository license for details.

## Disclaimer

These scripts are provided **as-is, without warranty of any kind**. Always test in a safe environment before deploying to live installations. The maintainers and contributors are not responsible for any damage or malfunction resulting from the use of these scripts.

---

Happy automating!
