import {inject, Injectable} from '@angular/core';
import {EthereumService} from "./ethereum";
import {ethers} from "ethers";
import {environment} from "../../../environments/environment";
import {ERC20_ABI} from "../../common/blockchain/abi/erc20.abi";

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
