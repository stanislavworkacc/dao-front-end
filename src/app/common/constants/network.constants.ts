export const networkConstantsId = {
    ethereumMainnet: 1,
    goerliTestnet: 5,
    sepoliaTestnet: 11155111,
    polygonMainnet: 137,
    mumbaiTestnet: 80001,
    localhost: 1337,
    hoodi: 560048,
} as const;

export const networkConstantsNames = {
    [networkConstantsId.ethereumMainnet]: 'Ethereum Mainnet',
    [networkConstantsId.goerliTestnet]: 'Goerli Testnet',
    [networkConstantsId.sepoliaTestnet]: 'Sepolia Testnet',
    [networkConstantsId.polygonMainnet]: 'Polygon Mainnet',
    [networkConstantsId.mumbaiTestnet]: 'Mumbai Testnet',
    [networkConstantsId.localhost]: 'Localhost',
    [networkConstantsId.hoodi]: 'Hoodi',
} as const;

export const chainIdHex = {
    [networkConstantsId.ethereumMainnet]: '0x1',
    [networkConstantsId.goerliTestnet]: '0x5',
    [networkConstantsId.sepoliaTestnet]: '0x11155111',
    [networkConstantsId.polygonMainnet]: '0x89',
    [networkConstantsId.mumbaiTestnet]: '0x13881',
    [networkConstantsId.localhost]: '0x539',
    [networkConstantsId.hoodi]: '0x88BB0',
} as const;