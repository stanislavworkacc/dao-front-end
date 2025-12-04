type AssetType = 'NATIVE' | 'ERC20';

interface AssetOption {
    label: string;
    symbol: string;
    type: AssetType;
    decimals?: number;
    balance?: null | string
}