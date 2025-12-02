import { environment } from '../../environments/environment';

export interface RpcUrls {
    http: string[];
    webSocket?: string[];
}

export interface BlockExplorer {
    name: string;
    url: string;
}

export interface AppNetworkConfig {
    id: number;
    name: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: {
        default: RpcUrls;
        public: RpcUrls;
    };
    blockExplorers: {
        default: BlockExplorer;
    };
}

const HOODI_SCAN = environment.RPC_URL;
const ALCHEMY_KEY = environment.ALCHEMY_KEY;

export const HOODI_NETWORK: AppNetworkConfig = {
    id: 560048,
    name: 'Ethereum Hoodi',
    nativeCurrency: {
        name: 'Hoodi Token',
        symbol: 'ETH',
        decimals: 6,
    },
    rpcUrls: {
        default: {
            http: [`https://eth-hoodi.g.alchemy.com/v2/${ALCHEMY_KEY}`],
            webSocket: ['wss://ethereum-hoodi-rpc.publicnode.com'],
        },
        public: {
            http: ['https://ethereum-hoodi-rpc.publicnode.com'],
            webSocket: ['wss://ethereum-hoodi-rpc.publicnode.com'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Hoodi Explorer',
            url: HOODI_SCAN,
        },
    },
};