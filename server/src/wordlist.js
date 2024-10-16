const wordlist = {
    terravilla: "Chilling in Terra Villa",
    generalStore: "Buying stuff in Buck's Galore",
    SaunaInterior: "Recovering energy in the Sauna",
    PLOTInterior: "Warping with the Infiniportal",
    PostOfficeInterior: "Claiming packages at the Post Office",
    MOIinterior: "Innovating stuff at MOI",
    DrunkenGooseInterior: "Getting drunk at the Drunken Goose",
    TerravillaPier: "Enjoying the sun on the Beach",
    BankInterior: "Getting a loan at the Bank",
    okx: "We love Fokxes very much!",
    HQinterior: "Exploring the Headquarters",
    theatre: "Watching a play at the Theater",
    carnival: "Having fun at the Carnival",
    barneyblitz: "Exploring Barney's Bazaarn",
    gachahub: "Forgot to redeem a Claim",
    petsInterior: "Buying snacks for Pets",
    TerravillaEastCrossroads: "Entering THE ROAD",
    superbowl: "Entering the Football Stadium"
};


function getMapDescription(mapName) {
    // If mapName is in the wordlist, return the custom description
    if (wordlist[mapName]) {
        return wordlist[mapName];
    }

    // Handle the "shareRent" pattern (e.g., "shareRent412684")
    if (mapName.startsWith("shareRent")) {
        const specNumber = mapName.match(/\d+$/)[0];  // Extract the number
        return `Farming on spec: ${specNumber}`;
    }

    if (mapName.startsWith("shareInterior")) {
        const InterNumber = mapName.match(/\d+$/)[0];  // Extract the number
        return `Visiting: ${InterNumber}'s Home`;
    }

    // Handle the "pixelsNFTFarm" pattern (e.g., "pixelsNFTFarm-281")
    if (mapName.startsWith("pixelsNFTFarm")) {
        const farmNumber = mapName.split('-')[1];  // Extract the farm number
        return `Farming on land: ${farmNumber}`;
    }

    if (mapName.startsWith("nftHouse")) {
        const nfthouse = mapName.match(/\d+$/)[0];  // Extract the farm number
        return `Inside the House of: ${nfthouse}`;
    }

    // Default description if no match found
    return `Exploring ${mapName}`;
}

module.exports = { getMapDescription };
