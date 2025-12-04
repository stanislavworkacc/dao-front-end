import {environment} from "../../../environments/environment";
import {chainIdHex, networkConstantsId, networkConstantsNames} from "../constants/network.constants";

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
    id: networkConstantsId.ethereumMainnet,
    chainIdHex: chainIdHex[networkConstantsId.ethereumMainnet],
    name: networkConstantsNames[networkConstantsId.ethereumMainnet],
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [`https://eth-hoodi.g.alchemy.com/v2/${environment.ALCHEMY_KEY}`],
    explorerUrls: ['https://etherscan.io/'],
};

export const HOODI_NETWORK: AppNetwork = {
    id: networkConstantsId.hoodi,
    chainIdHex: chainIdHex[networkConstantsId.hoodi],
    name: networkConstantsNames[networkConstantsId.hoodi],
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [`https://eth-hoodi.g.alchemy.com/v2/${environment.ALCHEMY_KEY}`, 'https://0xrpc.io/hoodi'],
    explorerUrls: ['https://hoodi.etherscan.io/'],
};

export const SUPPORTED_NETWORKS: AppNetwork[] = [
    ETHEREUM_MAINNET,
    HOODI_NETWORK,
];