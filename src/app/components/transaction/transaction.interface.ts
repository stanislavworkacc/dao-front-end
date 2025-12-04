import {tokenTypes} from "../../common/constants/tokens.constants";

export interface AssetOption {
    label: string;
    symbol: string;
    type: typeof tokenTypes.NATIVE | typeof tokenTypes.ERC20;
    decimals?: number;
    balance?: null | string
}