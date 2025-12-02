type AssetType = 'NATIVE' | 'ERC20';

interface AssetOption {
    label: string;
    symbol: string;
    type: AssetType;
    tokenAddress?: string;
    decimals?: number;
}