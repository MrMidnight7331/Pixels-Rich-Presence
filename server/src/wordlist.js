const fs = require('fs');
const path = require('path');

// Load the wordlist from the JSON file
let wordlist;
const wordlistPath = path.join(__dirname, '../wordlist.json');

try {
    const data = fs.readFileSync(wordlistPath, 'utf8');
    wordlist = JSON.parse(data);
} catch (error) {
    console.error('Error reading wordlist.json:', error);
}

function getMapDescription(mapName) {
    if (wordlist[mapName]) {
        return wordlist[mapName].description;
    }

    if (mapName.startsWith("shareRent")) {
        const specNumber = mapName.match(/\d+$/)[0];  // Extract the number
        return `Farming on spec: ${specNumber}`;
    }

    if (mapName.startsWith("shareInterior")) {
        const InterNumber = mapName.match(/\d+$/)[0];  // Extract the number
        return `Visiting: ${InterNumber}'s Home`;
    }

    if (mapName.startsWith("pixelsNFTFarm")) {
        const farmNumber = mapName.split('-')[1];  // Extract the farm number
        return `Farming on land: ${farmNumber}`;
    }

    if (mapName.startsWith("nftHouse")) {
        const nfthouse = mapName.match(/\d+$/)[0];  // Extract the house number
        return `Inside the House of: ${nfthouse}`;
    }

    return `Exploring ${mapName}`;
}

function getMapName(mapName) {
    if (wordlist[mapName]) {
        return wordlist[mapName].name;
    }
    return mapName;  // Default to mapName if no entry found
}

module.exports = { getMapDescription, getMapName };
