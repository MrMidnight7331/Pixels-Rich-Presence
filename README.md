# **Pixels Rich Presence**
> Version pre-1.0.0

**Pixels Rich Presence** is an Electron-based application that allows users to display real-time information about their activities in the *Pixels Game* on their Discord profile. The app integrates with Discord Rich Presence to show specific map locations, events, and in-game actions such as warping, farming, and exploring.

## <div align="center">**Table of Contents**</div>

<p align="center">
  <a href="#features">Features</a> |
  <a href="#user-installation">User Installation</a> |
  <a href="#developer-setup">Developer Setup</a> |
  <a href="#usage">Usage</a> |
  <a href="#customization">Building the App yourself</a> |
  <a href="#code-structure">Code Structure</a> |
  <a href="#donate">Donation</a> |
  <a href="#license">License</a>
</p>

---

## **Features**
- Real-time Discord Rich Presence integration with the *Pixels Game*.
- Custom map descriptions displayed based on the user’s in-game location.
- Automatically clears presence when the user closes the game.
- Cross-platform support for Windows and macOS.
- Electron-based app with a user-friendly setup and configuration.

## **User Installation**
If you're a user and just want to use the app, follow these simple steps:

1. **Chrome Extension**: Go to the [Chrome Web Store](https://chrome.google.com/webstore) and search for "Pixels Rich Presence" or download it directly using [this link](https://your-link-to-chrome-store).

2. **Server Application**: Download the server application for your platform:
    - **Windows**: [Download for Windows](https://your-link-to-windows-exe)

Once installed, the app will automatically integrate with Discord and update your status when playing *Pixels Online*.

---

## **Developer Setup**
If you're a developer and want to contribute or run the app locally, follow these steps.

### **Requirements**
- **Node.js**: v14.x or higher
- **npm**: v6.x or higher (comes with Node.js)
- **Discord Client App**: Discord Launcher must be available and running.
- **Discord Developer Account**: To set up your own Discord Rich Presence application, you'll need a [Discord Developer Account](https://discord.com/developers/applications).

### **Step 1: Clone the Repository**
Clone this repository to your local machine using Git:
```bash
git clone https://github.com/MrMidnight7331/Pixels-Rich-Presence.git
```

### **Step 2: Navigate to the Project Directory**
```bash
cd pixels-rich-presence
```

### **Step 3: Install Dependencies**
Install the required dependencies for both the server and extension:
```bash
# For the main app and server
npm install
```
### **Step 4: Set Up Discord Application**
1. Go to the Discord [Developer](https://discord.com/developers/) Portal.
2. Create a new application and enable Rich Presence.
3. Copy your Client ID and update the code in discord.js to use your own clientId.

### **Step 5: Add the Chrome Extension**
1. Go to chrome://extensions
2. Turn on developer mode
3. Drag n drop the crx file into the window or load unpacked to install the extension

### **Running the App for Development**
You can run the app in development mode to test its functionality.

```bash
npm start
```

### **Running the Production Version**
To build and run the production-ready version of the app:
```bash
npm run dist
```
This will generate a packaged executable (.exe).

## **Usage**
Once the application is running:

1. Make sure the extension has been installed correctly
2. Launch Discord client app
3. Launch play.pixels.xyz
4. The app will automatically update your Discord Rich Presence with information about your current in-game activity, such as the map name and event.
5. When you close the game, the app will clear your Discord Rich Presence.

## **Customization**
- You can customize the map descriptions by modifying the wordlist.js file located in the server folder.
- Add your own map or location descriptions to enhance the experience.

 ## **Code Structure**
- /extension: Contains the Chrome extension scripts and assets for interacting with the Pixels Console.
- /server: Contains the main server files for handling WebSocket connections and updating Discord Rich Presence.
  - discord.js: Manages the connection to Discord and updates the user's Rich Presence.
  - wordlist.js: Translates in-game map names to user-friendly descriptions.
  - server.js: Handles WebSocket connections and passes map updates to the Discord presence manager.
  - package.json: Manages dependencies and build configurations for the Electron app.

## **Contact**
Feel free ho contact me on my socials if you face any problem or need help with tbe setup process!

- [Twitter: @MrMidnight53](https://twitter.com/MrMidnight53)
- [Instagram: mrmidnight7331](https://www.instagram.com/mrmidnight7331)
- [LinkTree: MrMidnight53](https://linktr.ee/MrMidnight53)

## **Donate**
If you think I did a good job feel free to donate here, to help me create more OpenSource Projects (Money doesn't grow on OpenSource Projects):

ETH: 0x939A9353e1a72e5d6Da07424c74815a6651a86f4

MATIC: 0x939A9353e1a72e5d6Da07424c74815a6651a86f4

SOLANA: HsNpPDGhDsmq4j1PBTDuMx67svj6446m8aUWGSpjGCjk

BTC: bc1q55kfd0elssc9u3ha86gw4ea9w3l5cw7ch58hce

Or buy me a coffee here:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S7NRQSG)

## **License**
  This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
