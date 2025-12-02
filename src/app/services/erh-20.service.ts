import {inject, Injectable} from '@angular/core';
import {EthereumService} from "./ethereum";
import {ethers} from "ethers";
import {environment} from "../../environments/environment";

export const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
];

@Injectable({
  providedIn: 'root'
})
export class Erh20Service {
    private readonly _ethereumService: EthereumService = inject(EthereumService);

    async sendErc20Token(
        to: string,
        amount: string,
        decimals = 6
    ): Promise<string> {
        if (!this._ethereumService.getSigner) {
            throw new Error('Wallet not connected');
        }

        try {
            const erc20 = new ethers.Contract(environment.TOKEN_CONTRACT, ERC20_ABI, this._ethereumService.getSigner);
            const amountWei: bigint = ethers.parseUnits(amount, decimals);

            const tx = await erc20['transfer'](to, amountWei);
            const receipt = await tx.wait();
            await this._ethereumService.updateWalletInfo();

            return receipt?.hash || '';
        } catch (error) {
            console.error('ERC20 transfer failed:', error);
            throw error;
        }
    }
}
