import {environment} from "../../environments/environment";

export interface AppNetwork {
    id: number;
    chainIdHex: string;
    name: string;
    symbol: string;
    decimals: number;
    rpcUrls: string[];
    explorerUrls?: string[];
}

export const ETHEREUM_MAINNET: AppNetwork = {
    id: 1,
    chainIdHex: '0x1',
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [`https://eth-hoodi.g.alchemy.com/v2/${environment.ALCHEMY_KEY}`],
    explorerUrls: ['https://etherscan.io/'],
};

export const HOODI_NETWORK: AppNetwork = {
    id: 560048,
    chainIdHex: '0x88EB0', // приклад, підстав свій hex chainId
    name: 'Ethereum Hoodi',
    symbol: 'ETH',
    decimals: 6,
    rpcUrls: [`https://eth-hoodi.g.alchemy.com/v2/${environment.ALCHEMY_KEY}`],
    explorerUrls: ['https://hoodi.etherscan.io/'],
};

export const SUPPORTED_NETWORKS: AppNetwork[] = [
    ETHEREUM_MAINNET,
    HOODI_NETWORK,
];